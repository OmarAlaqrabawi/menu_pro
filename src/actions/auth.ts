// src/actions/auth.ts
"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { loginSchema, registerSchema } from "@/validators/auth";
import type { LoginInput, RegisterInput } from "@/validators/auth";
import { AuthError } from "next-auth";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function loginAction(data: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    // AuthError = wrong credentials
    if (error instanceof AuthError) {
      return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    // NEXT_REDIRECT = login succeeded, NextAuth is redirecting
    throw error;
  }
}

export async function registerAction(data: RegisterInput): Promise<ActionResult> {
  try {
    const validated = registerSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { success: false, error: "البريد الإلكتروني مسجل مسبقاً" };
    }

    const passwordHash = await hash(data.password, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: "RESTAURANT_OWNER",
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء إنشاء الحساب" };
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
}
