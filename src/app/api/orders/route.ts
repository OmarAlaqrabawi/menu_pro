export const dynamic = "force-dynamic";
// src/app/api/orders/route.ts
// Public API — no auth required. Creates an order from customer menu.
// SECURITY: Prices are verified server-side from DB, not trusted from client.
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

    // Sanitize text inputs
    const safeName = customerName ? String(customerName).slice(0, 100).replace(/<[^>]*>/g, '') : null;
    const safePhone = customerPhone ? String(customerPhone).slice(0, 20).replace(/[^\d+\-\s]/g, '') : null;
    const safeNotes = notes ? String(notes).slice(0, 500).replace(/<[^>]*>/g, '') : null;

    // Validate restaurant exists and is active
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json({ error: "المطعم غير متاح حالياً" }, { status: 404 });
    }

    // ── SERVER-SIDE PRICE VERIFICATION ──
    // Fetch all item prices from DB — NEVER trust client-sent prices
    const itemIds = items.map((i: { itemId: string }) => i.itemId);
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds }, isAvailable: true },
      include: { sizes: true, extras: true },
    });

    if (dbItems.length !== itemIds.length) {
      return NextResponse.json({ error: "بعض الأصناف غير متوفرة" }, { status: 400 });
    }

    const dbItemMap = new Map(dbItems.map(i => [i.id, i]));

    // Recalculate verified items with real prices
    const verifiedItems = items.map((clientItem: { itemId: string; quantity: number; sizeId?: string; extraIds?: string[]; sizeName?: string; extras?: string[]; notes?: string; itemName?: string }) => {
      const dbItem = dbItemMap.get(clientItem.itemId)!;

      // Base price: use discountPrice if available, else regular price
      let unitPrice = dbItem.discountPrice ?? dbItem.price;

      // If size selected, use size price
      let sizeName: string | null = null;
      if (clientItem.sizeId) {
        const size = dbItem.sizes.find(s => s.id === clientItem.sizeId);
        if (size) {
          unitPrice = size.price;
          sizeName = size.nameAr;
        }
      } else if (clientItem.sizeName) {
        // Fallback: match by name
        const size = dbItem.sizes.find(s => s.nameAr === clientItem.sizeName);
        if (size) {
          unitPrice = size.price;
          sizeName = size.nameAr;
        }
      }

      // Add extras prices
      let extrasTotal = 0;
      const extraNames: string[] = [];
      if (clientItem.extraIds && clientItem.extraIds.length > 0) {
        for (const extraId of clientItem.extraIds) {
          const extra = dbItem.extras.find(e => e.id === extraId);
          if (extra) {
            extrasTotal += extra.price;
            extraNames.push(extra.nameAr);
          }
        }
      } else if (clientItem.extras && clientItem.extras.length > 0) {
        // Fallback: match by name
        for (const extraName of clientItem.extras) {
          const extra = dbItem.extras.find(e => e.nameAr === extraName);
          if (extra) {
            extrasTotal += extra.price;
            extraNames.push(extra.nameAr);
          }
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

    // Calculate verified totals
    const subtotal = verifiedItems.reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * (restaurant.taxPercent / 100);
    const serviceAmount = subtotal * (restaurant.servicePercent / 100);
    const total = subtotal + taxAmount + serviceAmount;

    // ── ATOMIC ORDER CREATION with sequential orderNumber ──
    const order = await prisma.$transaction(async (tx) => {
      // Get next order number atomically inside transaction
      const lastOrder = await tx.order.findFirst({
        where: { restaurantId },
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

      return tx.order.create({
        data: {
          restaurantId,
          orderNumber,
          customerName: safeName,
          customerPhone: safePhone,
          orderType,
          tableId: tableId || null,
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

    // Create notification (outside transaction — non-critical)
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
    } catch {
      // Notification failure shouldn't block order
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      total,
      status: "NEW",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء الطلب" }, { status: 500 });
  }
}
