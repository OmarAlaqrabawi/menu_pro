// src/auth.ts
// NextAuth v5 configuration with Credentials provider + Role-based access

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH] Missing credentials");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;
          console.log("[AUTH] Attempting login for:", email);

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.passwordHash) {
            console.log("[AUTH] User not found:", email);
            return null;
          }

          // Block inactive users
          if (!user.isActive) {
            throw new Error("ACCOUNT_DISABLED");
          }

          const isValid = await compare(password, user.passwordHash);
          if (!isValid) {
            console.log("[AUTH] Invalid password for:", email);
            return null;
          }

          console.log("[AUTH] Login success for:", email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH] Error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
