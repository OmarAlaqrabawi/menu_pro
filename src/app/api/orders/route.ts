export const dynamic = "force-dynamic";
// src/app/api/orders/route.ts
// Public API — no auth required. Creates an order from customer menu.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { restaurantId, customerName, customerPhone, orderType, tableId, notes, items } = body;

    // Validate required fields
    if (!restaurantId || !orderType || !items || items.length === 0) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // Validate restaurant exists and is active
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json({ error: "المطعم غير متاح حالياً" }, { status: 404 });
    }

    // Calculate next order number
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity, 0
    );
    const taxAmount = subtotal * (restaurant.taxPercent / 100);
    const serviceAmount = subtotal * (restaurant.servicePercent / 100);
    const total = subtotal + taxAmount + serviceAmount;

    // Create order
    const order = await prisma.order.create({
      data: {
        restaurantId,
        orderNumber,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        orderType,
        tableId: tableId || null,
        notes: notes || null,
        subtotal,
        taxAmount,
        serviceAmount,
        total,
        status: "NEW",
        items: {
          create: items.map((item: { itemId: string; itemName: string; quantity: number; unitPrice: number; sizeName?: string; extras?: string[]; notes?: string }) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            sizeName: item.sizeName || null,
            extras: item.extras ? JSON.stringify(item.extras) : null,
            notes: item.notes || null,
          })),
        },
      },
    });

    // Create notification for restaurant owner
    await prisma.notification.create({
      data: {
        userId: restaurant.userId,
        restaurantId: restaurant.id,
        type: "NEW_ORDER",
        title: `طلب جديد #${orderNumber}`,
        body: `طلب جديد${customerName ? " من " + customerName : ""} — ${total.toFixed(2)} ${restaurant.currency}`,
      },
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      total,
      status: "NEW",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء الطلب" }, { status: 500 });
  }
}
