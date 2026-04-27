// src/app/api/analytics/track/route.ts
// Public API — no auth required. Tracks analytics events from customer menu.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_EVENTS = [
  "MENU_VIEW", "CATEGORY_VIEW", "ITEM_VIEW",
  "ITEM_ADD_TO_CART", "ORDER_PLACED", "QR_SCAN",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantId, eventType, categoryId, itemId } = body;

    if (!restaurantId || !eventType) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    if (!VALID_EVENTS.includes(eventType)) {
      return NextResponse.json({ error: "invalid event type" }, { status: 400 });
    }

    // Fire and forget — don't block the response
    await prisma.analyticsEvent.create({
      data: {
        restaurantId,
        eventType,
        categoryId: categoryId || null,
        itemId: itemId || null,
        visitorIp: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        referrer: request.headers.get("referer") || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "tracking failed" }, { status: 500 });
  }
}
