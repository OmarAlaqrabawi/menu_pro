// src/actions/user.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hash } from "bcryptjs";

type ActionResult = { success: boolean; error?: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// Get all users with their restaurants
export async function getUsers() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.user.findMany({
    include: {
      restaurants: { select: { id: true, nameAr: true } },
      _count: { select: { restaurants: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Create a new user
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "ليس لديك صلاحية" };

  if (!data.name || !data.email || !data.password) {
    return { success: false, error: "جميع الحقول مطلوبة" };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { success: false, error: "البريد الإلكتروني مستخدم مسبقاً" };
  }

  const passwordHash = await hash(data.password, 10);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: data.role || "RESTAURANT_OWNER",
      isActive: true,
    },
  });

  return { success: true };
}

// Delete a user
export async function deleteUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "ليس لديك صلاحية" };

  if (userId === admin.id) {
    return { success: false, error: "لا يمكنك حذف حسابك" };
  }

  // Check if user has restaurants
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { restaurants: true } } },
  });

  if (!user) return { success: false, error: "المستخدم غير موجود" };

  // Delete user's sessions and accounts first
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  return { success: true };
}

// Toggle user active status
export async function toggleUserActive(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "ليس لديك صلاحية" };

  if (userId === admin.id) {
    return { success: false, error: "لا يمكنك تعطيل حسابك" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "المستخدم غير موجود" };

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  // If deactivating, also deactivate their restaurants
  if (user.isActive) {
    await prisma.restaurant.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  return { success: true };
}

// Change user role
export async function changeUserRole(userId: string, role: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "ليس لديك صلاحية" };

  if (userId === admin.id) {
    return { success: false, error: "لا يمكنك تغيير دورك" };
  }

  if (!["ADMIN", "RESTAURANT_OWNER", "STAFF"].includes(role)) {
    return { success: false, error: "دور غير صالح" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return { success: true };
}

// Assign restaurant to user
export async function assignRestaurantToUser(userId: string, restaurantId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "ليس لديك صلاحية" };

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { userId },
  });

  return { success: true };
}

// Get all restaurants (for assignment dropdown)
export async function getAllRestaurants() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.restaurant.findMany({
    select: { id: true, nameAr: true, userId: true },
    orderBy: { nameAr: "asc" },
  });
}

// Reset user password
export async function resetUserPassword(userId: string, newPassword: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "ليس لديك صلاحية" };

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
  }

  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}
