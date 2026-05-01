// src/actions/restaurant.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRestaurantSchema, updateRestaurantSchema, updatePermissionsSchema } from "@/validators/restaurant";
import type { CreateRestaurantInput, UpdateRestaurantInput, UpdatePermissionsInput } from "@/validators/restaurant";
import type { ActionResult } from "./auth";

// ─── Helper: Get current user with role check ───
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as { id: string; role?: string };
}

function isAdmin(user: { role?: string }) {
  return user.role === "ADMIN";
}

// ─── Get all restaurants (Admin sees all, Owner sees own) ───
export async function getRestaurants() {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isAdmin(user)) {
    return prisma.restaurant.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { categories: true, orders: true, tables: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.restaurant.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { categories: true, orders: true, tables: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Get single restaurant ───
export async function getRestaurant(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      categories: {
        include: { items: { include: { sizes: true, extras: true, images: true } } },
        orderBy: { sortOrder: "asc" },
      },
      tables: { orderBy: { tableNumber: "asc" } },
      _count: { select: { orders: true } },
    },
  });

  if (!restaurant) return null;

  // Owner can only see their own
  if (!isAdmin(user) && restaurant.userId !== user.id) return null;

  return restaurant;
}

// ─── Create restaurant ───
export async function createRestaurant(data: CreateRestaurantInput): Promise<ActionResult & { id?: string }> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { success: false, error: "غير مصرح لك بإنشاء مطعم" };
  }

  const validated = createRestaurantSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const existingSlug = await prisma.restaurant.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    return { success: false, error: "الرابط المختصر مستخدم مسبقاً" };
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      ...validated.data,
      userId: user.id,
    },
  });

  return { success: true, id: restaurant.id };
}

// ─── Update restaurant ───
export async function updateRestaurant(id: string, data: UpdateRestaurantInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) return { success: false, error: "المطعم غير موجود" };

  // Check permissions
  if (!isAdmin(user)) {
    if (restaurant.userId !== user.id) return { success: false, error: "غير مصرح لك" };
    // Check owner-specific permissions
    if (data.nameAr || data.nameEn || data.slug) {
      if (!restaurant.ownerCanEditBranding) return { success: false, error: "لا تملك صلاحية تعديل بيانات المطعم" };
    }
  }

  const validated = updateRestaurantSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  await prisma.restaurant.update({
    where: { id },
    data: validated.data,
  });

  return { success: true };
}

// ─── Toggle restaurant active status ───
export async function toggleRestaurantStatus(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { success: false, error: "مسموح فقط للأدمن" };
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) return { success: false, error: "المطعم غير موجود" };

  await prisma.restaurant.update({
    where: { id },
    data: { isActive: !restaurant.isActive },
  });

  return { success: true };
}

// ─── Update owner permissions (Admin only) ───
export async function updateOwnerPermissions(id: string, data: UpdatePermissionsInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { success: false, error: "مسموح فقط للأدمن" };
  }

  const validated = updatePermissionsSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  await prisma.restaurant.update({
    where: { id },
    data: validated.data,
  });

  return { success: true };
}

// ─── Delete restaurant (Admin only) — cascade delete everything ───
export async function deleteRestaurant(id: string, confirmName: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { success: false, error: "مسموح فقط للأدمن" };
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) return { success: false, error: "المطعم غير موجود" };

  // Verify name matches
  if (restaurant.nameAr !== confirmName) {
    return { success: false, error: "اسم المطعم غير مطابق" };
  }

  // Cascade delete atomically (all or nothing)
  await prisma.$transaction([
    // 1. Delete order items -> orders
    prisma.orderItem.deleteMany({ where: { order: { restaurantId: id } } }),
    prisma.order.deleteMany({ where: { restaurantId: id } }),
    // 2. Delete menu: item images, sizes, extras -> items -> categories
    prisma.itemImage.deleteMany({ where: { item: { category: { restaurantId: id } } } }),
    prisma.itemSize.deleteMany({ where: { item: { category: { restaurantId: id } } } }),
    prisma.itemExtra.deleteMany({ where: { item: { category: { restaurantId: id } } } }),
    prisma.item.deleteMany({ where: { category: { restaurantId: id } } }),
    prisma.category.deleteMany({ where: { restaurantId: id } }),
    // 3. Delete other related data
    prisma.table.deleteMany({ where: { restaurantId: id } }),
    prisma.coverImage.deleteMany({ where: { restaurantId: id } }),
    prisma.rating.deleteMany({ where: { restaurantId: id } }),
    prisma.analyticsEvent.deleteMany({ where: { restaurantId: id } }),
    prisma.notification.deleteMany({ where: { restaurantId: id } }),
    // 4. Finally delete the restaurant
    prisma.restaurant.delete({ where: { id } }),
  ]);

  return { success: true };
}
