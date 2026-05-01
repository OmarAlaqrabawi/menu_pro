// src/actions/notification.ts
"use server";

import { getAuthUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// ─── Get user notifications ───
export async function getNotifications(limit = 20) {
  const user = await getAuthUser();
  if (!user) return [];
  const safeLimit = Math.min(Math.max(1, limit), 100);

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: safeLimit,
  });
}

// ─── Get unread count ───
export async function getUnreadCount() {
  const user = await getAuthUser();
  if (!user) return 0;

  return prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });
}

// ─── Mark notification as read ───
export async function markAsRead(id: string) {
  const user = await getAuthUser();
  if (!user) return;

  await prisma.notification.update({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
}

// ─── Mark all as read ───
export async function markAllAsRead() {
  const user = await getAuthUser();
  if (!user) return;

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
}

// ─── Delete notification ───
export async function deleteNotification(id: string) {
  const user = await getAuthUser();
  if (!user) return;

  await prisma.notification.deleteMany({ where: { id, userId: user.id } });
}
