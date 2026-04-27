// src/app/api/orders/check/route.ts
// Endpoint for polling new order count (used by notification system)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const count = await prisma.order.count({
    where: { restaurantId, status: "NEW" },
  });

  const latest = await prisma.order.findFirst({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  return NextResponse.json({
    count,
    latestOrderNumber: latest?.orderNumber || 0,
  });
}
