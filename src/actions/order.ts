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

// ─── Create order (from customer menu — SERVER-SIDE PRICE VERIFIED) ───
export async function createOrder(data: {
  restaurantId: string;
  customerName?: string;
  customerPhone?: string;
  orderType: string;
  tableId?: string;
  notes?: string;
  items: { itemId: string; quantity: number; sizeId?: string; extraIds?: string[]; sizeName?: string; extras?: string[]; notes?: string }[];
}): Promise<ActionResult & { orderNumber?: number }> {
  // Validate orderType
  const VALID_ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY", "SCHEDULED"];
  if (!data.restaurantId || !data.orderType || !data.items || data.items.length === 0) {
    return { success: false, error: "بيانات ناقصة" };
  }
  if (!VALID_ORDER_TYPES.includes(data.orderType)) {
    return { success: false, error: "نوع الطلب غير صالح" };
  }
  if (data.items.length > 50) {
    return { success: false, error: "الحد الأقصى 50 عنصر في الطلب" };
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } });
  if (!restaurant || !restaurant.isActive) return { success: false, error: "المطعم غير متاح حالياً" };

  // Validate tableId belongs to this restaurant
  if (data.tableId) {
    const table = await prisma.table.findUnique({ where: { id: data.tableId } });
    if (!table || table.restaurantId !== data.restaurantId) {
      return { success: false, error: "الطاولة غير صالحة لهذا المطعم" };
    }
  }

  // SERVER-SIDE PRICE VERIFICATION — NEVER trust client prices
  const itemIds = [...new Set(data.items.map(i => i.itemId))];
  const dbItems = await prisma.item.findMany({
    where: {
      id: { in: itemIds },
      isAvailable: true,
      category: { restaurantId: data.restaurantId },
    },
    include: { sizes: true, extras: true },
  });

  if (dbItems.length !== itemIds.length) {
    return { success: false, error: "بعض الأصناف غير متوفرة أو لا تنتمي لهذا المطعم" };
  }

  const dbItemMap = new Map(dbItems.map(i => [i.id, i]));

  const verifiedItems = data.items.map(clientItem => {
    const dbItem = dbItemMap.get(clientItem.itemId)!;
    let unitPrice = dbItem.discountPrice ?? dbItem.price;
    let sizeName: string | null = null;

    if (clientItem.sizeId) {
      const size = dbItem.sizes.find(s => s.id === clientItem.sizeId);
      if (size) { unitPrice = size.price; sizeName = size.nameAr; }
    } else if (clientItem.sizeName) {
      const size = dbItem.sizes.find(s => s.nameAr === clientItem.sizeName);
      if (size) { unitPrice = size.price; sizeName = size.nameAr; }
    }

    let extrasTotal = 0;
    const extraNames: string[] = [];
    if (clientItem.extraIds?.length) {
      for (const extraId of clientItem.extraIds) {
        const extra = dbItem.extras.find(e => e.id === extraId);
        if (extra) { extrasTotal += extra.price; extraNames.push(extra.nameAr); }
      }
    } else if (clientItem.extras?.length) {
      for (const extraName of clientItem.extras) {
        const extra = dbItem.extras.find(e => e.nameAr === extraName);
        if (extra) { extrasTotal += extra.price; extraNames.push(extra.nameAr); }
      }
    }

    const totalUnitPrice = unitPrice + extrasTotal;
    const quantity = Math.max(1, Math.min(99, Math.floor(clientItem.quantity)));

    return {
      itemId: dbItem.id,
      itemName: dbItem.nameAr,
      quantity,
      unitPrice: totalUnitPrice,
      totalPrice: totalUnitPrice * quantity,
      sizeName,
      extras: extraNames.length > 0 ? JSON.stringify(extraNames) : null,
      notes: clientItem.notes ? String(clientItem.notes).slice(0, 200) : null,
    };
  });

  const subtotal = verifiedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = subtotal * (restaurant.taxPercent / 100);
  const serviceAmount = subtotal * (restaurant.servicePercent / 100);
  const total = subtotal + taxAmount + serviceAmount;

  // Sanitize text
  const safeName = data.customerName ? String(data.customerName).slice(0, 100).replace(/<[^>]*>/g, '') : undefined;
  const safeNotes = data.notes ? String(data.notes).slice(0, 500).replace(/<[^>]*>/g, '') : undefined;

  // ATOMIC order creation with retry
  let order;
  let retries = 3;
  while (retries > 0) {
    try {
      order = await prisma.$transaction(async (tx) => {
        const lastOrder = await tx.order.findFirst({
          where: { restaurantId: data.restaurantId },
          orderBy: { orderNumber: "desc" },
          select: { orderNumber: true },
        });
        const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

        return tx.order.create({
          data: {
            restaurantId: data.restaurantId,
            orderNumber,
            customerName: safeName,
            customerPhone: data.customerPhone,
            orderType: data.orderType,
            tableId: data.tableId,
            notes: safeNotes,
            subtotal,
            taxAmount,
            serviceAmount,
            total,
            status: "NEW",
            items: { create: verifiedItems },
          },
        });
      });
      break;
    } catch (err: unknown) {
      retries--;
      if (retries > 0 && err instanceof Error && err.message.includes("Unique constraint")) continue;
      throw err;
    }
  }

  if (!order) return { success: false, error: "فشل إنشاء الطلب" };

  // Notify restaurant owner (non-critical)
  try {
    await prisma.notification.create({
      data: {
        userId: restaurant.userId,
        restaurantId: restaurant.id,
        type: "NEW_ORDER",
        title: `طلب جديد #${order.orderNumber}`,
        body: `طلب جديد${safeName ? " من " + safeName : ""} — ${total.toFixed(2)} ${restaurant.currency}`,
      },
    });
  } catch { /* non-critical */ }

  return { success: true, orderNumber: order.orderNumber };
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
