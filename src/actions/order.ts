// src/actions/order.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusSchema, createOrderSchema } from "@/validators/order";
import { OrderStatusFlow } from "@/types";
import type { ActionResult } from "./auth";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as { id: string; role?: string };
}

// ─── Get orders (with filters) ───
export async function getOrders(filters?: {
  restaurantId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const user = await getCurrentUser();
  if (!user) return { orders: [], total: 0 };

  const where: Record<string, unknown> = {};

  if (user.role !== "ADMIN") {
    // Owner can only see their restaurants' orders
    const restaurants = await prisma.restaurant.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    where.restaurantId = { in: restaurants.map((r) => r.id) };
  } else if (filters?.restaurantId) {
    where.restaurantId = filters.restaurantId;
  }

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        restaurant: { select: { nameAr: true, slug: true } },
        table: { select: { tableNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

// ─── Get single order ───
export async function getOrder(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      restaurant: { select: { nameAr: true, slug: true, currency: true } },
      table: { select: { tableNumber: true } },
    },
  });

  if (!order) return null;

  // Access control
  if (user.role !== "ADMIN") {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
    if (restaurant?.userId !== user.id) return null;
  }

  return order;
}

// ─── Update order status ───
export async function updateOrderStatus(orderId: string, newStatus: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const validated = updateOrderStatusSchema.safeParse({ orderId, status: newStatus });
  if (!validated.success) return { success: false, error: "حالة غير صالحة" };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: "الطلب غير موجود" };

  // Check access
  if (user.role !== "ADMIN") {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
    if (restaurant?.userId !== user.id) return { success: false, error: "غير مصرح لك" };
  }

  // Validate status transition
  const allowed = OrderStatusFlow[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `لا يمكن تغيير الحالة من ${order.status} إلى ${newStatus}` };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  // Create notification for order owner
  const restaurant = await prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
  if (restaurant) {
    await prisma.notification.create({
      data: {
        userId: restaurant.userId,
        restaurantId: restaurant.id,
        type: "ORDER_UPDATED",
        title: `تحديث الطلب #${order.orderNumber}`,
        body: `تم تغيير حالة الطلب إلى ${newStatus}`,
      },
    });
  }

  return { success: true };
}

// ─── Create order (from customer menu) ───
export async function createOrder(data: {
  restaurantId: string;
  customerName?: string;
  customerPhone?: string;
  orderType: string;
  tableId?: string;
  notes?: string;
  items: { itemId: string; itemName: string; quantity: number; unitPrice: number; sizeName?: string; extras?: string[]; notes?: string }[];
}): Promise<ActionResult & { orderNumber?: number }> {
  const validated = createOrderSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  const restaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } });
  if (!restaurant || !restaurant.isActive) return { success: false, error: "المطعم غير متاح حالياً" };

  // Calculate next order number
  const lastOrder = await prisma.order.findFirst({
    where: { restaurantId: data.restaurantId },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = subtotal * (restaurant.taxPercent / 100);
  const serviceAmount = subtotal * (restaurant.servicePercent / 100);
  const total = subtotal + taxAmount + serviceAmount;

  const order = await prisma.order.create({
    data: {
      restaurantId: data.restaurantId,
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      orderType: data.orderType,
      tableId: data.tableId,
      notes: data.notes,
      subtotal,
      taxAmount,
      serviceAmount,
      total,
      status: "NEW",
      items: {
        create: data.items.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          sizeName: item.sizeName,
          extras: item.extras ? JSON.stringify(item.extras) : null,
          notes: item.notes,
        })),
      },
    },
  });

  // Notify restaurant owner
  await prisma.notification.create({
    data: {
      userId: restaurant.userId,
      restaurantId: restaurant.id,
      type: "NEW_ORDER",
      title: `طلب جديد #${orderNumber}`,
      body: `طلب جديد${data.customerName ? " من " + data.customerName : ""} — ${total.toFixed(2)} ${restaurant.currency}`,
    },
  });

  return { success: true, orderNumber };
}

// ─── Get order stats for dashboard ───
export async function getOrderStats(restaurantId?: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const where: Record<string, unknown> = {};
  if (user.role !== "ADMIN") {
    const restaurants = await prisma.restaurant.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    where.restaurantId = { in: restaurants.map((r) => r.id) };
  } else if (restaurantId) {
    where.restaurantId = restaurantId;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, newOrders, preparingOrders, readyOrders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: { ...where, createdAt: { gte: today } } }),
    prisma.order.count({ where: { ...where, status: "NEW" } }),
    prisma.order.count({ where: { ...where, status: "PREPARING" } }),
    prisma.order.count({ where: { ...where, status: "READY" } }),
  ]);

  // Revenue calculation
  const orders = await prisma.order.findMany({
    where: { ...where, status: { not: "CANCELLED" } },
    select: { total: true, createdAt: true },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyRevenue = orders
    .filter((o) => o.createdAt >= thisMonth)
    .reduce((sum, o) => sum + o.total, 0);

  return {
    totalOrders,
    todayOrders,
    newOrders,
    preparingOrders,
    readyOrders,
    totalRevenue,
    monthlyRevenue,
  };
}

// ─── Delete order ───
export async function deleteOrder(orderId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: "الطلب غير موجود" };

  // Check access & permission
  if (user.role !== "ADMIN") {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
    if (restaurant?.userId !== user.id) {
      return { success: false, error: "غير مصرح لك" };
    }
    if (!restaurant.ownerCanDeleteOrders) {
      return { success: false, error: "ليس لديك صلاحية حذف الطلبات. تواصل مع الإدارة لتفعيل هذه الصلاحية." };
    }
  }

  await prisma.order.delete({ where: { id: orderId } });
  return { success: true };
}
