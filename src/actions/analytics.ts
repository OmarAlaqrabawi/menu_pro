// src/actions/analytics.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as { id: string; role?: string };
}

// ─── Dashboard overview stats ───
export async function getDashboardStats() {
  const user = await getCurrentUser();
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  // Get accessible restaurants
  const restaurants = isAdmin
    ? await prisma.restaurant.findMany({ select: { id: true } })
    : await prisma.restaurant.findMany({ where: { userId: user.id }, select: { id: true } });

  const restaurantIds = restaurants.map((r) => r.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  // Parallel queries
  const [
    totalRestaurants,
    activeRestaurants,
    todayOrders,
    monthOrders,
    lastMonthOrders,
    allOrders,
    menuViews,
    lastMonthViews,
  ] = await Promise.all([
    isAdmin ? prisma.restaurant.count() : restaurants.length,
    isAdmin ? prisma.restaurant.count({ where: { isActive: true } }) : prisma.restaurant.count({ where: { userId: user.id, isActive: true } }),
    prisma.order.count({ where: { restaurantId: { in: restaurantIds }, createdAt: { gte: today } } }),
    prisma.order.findMany({
      where: { restaurantId: { in: restaurantIds }, createdAt: { gte: thisMonth }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { restaurantId: { in: restaurantIds }, createdAt: { gte: lastMonth, lt: thisMonth }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { restaurantId: { in: restaurantIds }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId: { in: restaurantIds }, eventType: "MENU_VIEW", createdAt: { gte: thisMonth } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId: { in: restaurantIds }, eventType: "MENU_VIEW", createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
  ]);

  const monthlyRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.total, 0);
  const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
  const revenueChange = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const viewsChange = lastMonthViews > 0 ? ((menuViews - lastMonthViews) / lastMonthViews) * 100 : 0;

  return {
    totalRestaurants,
    activeRestaurants,
    todayOrders,
    monthlyRevenue,
    totalRevenue,
    revenueChange: Math.round(revenueChange),
    menuViews,
    viewsChange: Math.round(viewsChange),
  };
}

// ─── Track analytics event (for public menu) ───
export async function trackEvent(data: {
  restaurantId: string;
  eventType: string;
  categoryId?: string;
  itemId?: string;
}) {
  await prisma.analyticsEvent.create({
    data: {
      restaurantId: data.restaurantId,
      eventType: data.eventType,
      categoryId: data.categoryId,
      itemId: data.itemId,
    },
  });
}
