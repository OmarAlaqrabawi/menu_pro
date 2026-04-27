// src/actions/table.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTableSchema, updateTableSchema, bulkCreateTablesSchema } from "@/validators/table";
import type { ActionResult } from "./auth";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as { id: string; role?: string };
}

async function canManageTables(user: { id: string; role?: string }, restaurantId: string) {
  if (user.role === "ADMIN") return true;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return false;
  return restaurant.userId === user.id && restaurant.ownerCanManageTables;
}

// ─── Get tables ───
export async function getTables(restaurantId: string) {
  return prisma.table.findMany({
    where: { restaurantId },
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { tableNumber: "asc" },
  });
}

// ─── Create single table ───
export async function createTable(data: { restaurantId: string; tableNumber: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };
  if (!(await canManageTables(user, data.restaurantId))) return { success: false, error: "لا تملك صلاحية إدارة الطاولات" };

  const validated = createTableSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  const existing = await prisma.table.findFirst({
    where: { restaurantId: data.restaurantId, tableNumber: data.tableNumber },
  });
  if (existing) return { success: false, error: "رقم الطاولة مستخدم مسبقاً" };

  await prisma.table.create({ data: validated.data });
  return { success: true };
}

// ─── Bulk create tables ───
export async function bulkCreateTables(data: { restaurantId: string; count: number; startNumber?: number }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };
  if (!(await canManageTables(user, data.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const validated = bulkCreateTablesSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  const start = data.startNumber ?? 1;
  const tables = Array.from({ length: data.count }, (_, i) => ({
    restaurantId: data.restaurantId,
    tableNumber: String(start + i),
    isActive: true,
  }));

  await prisma.table.createMany({ data: tables });
  return { success: true };
}

// ─── Update table ───
export async function updateTable(id: string, data: { tableNumber?: string; isActive?: boolean }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const table = await prisma.table.findUnique({ where: { id } });
  if (!table) return { success: false, error: "الطاولة غير موجودة" };
  if (!(await canManageTables(user, table.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const validated = updateTableSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  await prisma.table.update({ where: { id }, data: validated.data });
  return { success: true };
}

// ─── Delete table ───
export async function deleteTable(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const table = await prisma.table.findUnique({ where: { id } });
  if (!table) return { success: false, error: "الطاولة غير موجودة" };
  if (!(await canManageTables(user, table.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  await prisma.table.delete({ where: { id } });
  return { success: true };
}

// ─── Generate QR URL for table ───
export async function generateTableQrUrl(id: string): Promise<ActionResult & { url?: string }> {
  const table = await prisma.table.findUnique({
    where: { id },
    include: { restaurant: { select: { slug: true } } },
  });
  if (!table) return { success: false, error: "الطاولة غير موجودة" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qrUrl = `${appUrl}/${table.restaurant.slug}?table=${table.tableNumber}`;

  await prisma.table.update({ where: { id }, data: { qrCodeUrl: qrUrl } });

  return { success: true, url: qrUrl };
}
