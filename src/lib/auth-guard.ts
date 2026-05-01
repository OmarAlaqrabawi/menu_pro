// src/lib/auth-guard.ts
// Centralized authentication helper — DB-verified user on every call
// Ensures isActive + current role are always fresh from the database
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface AuthUser {
  id: string;
  role: string;
  isActive: boolean;
}

/**
 * Verifies current session against the database.
 * Returns null if: no session, user not found, or user is deactivated.
 * ALWAYS reads from DB — never trusts JWT role alone.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  return user;
}

/**
 * Requires ADMIN role — DB-verified.
 */
export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
