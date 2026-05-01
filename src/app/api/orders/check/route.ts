export const dynamic = "force-dynamic";
// src/app/api/orders/check/route.ts
// Protected API — requires authentication. Checks new order count.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  // Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  // Verify user owns this restaurant or is admin
  const user = session.user as { id: string; role?: string };
  if (user.role !== "ADMIN") {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant || restaurant.userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
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
