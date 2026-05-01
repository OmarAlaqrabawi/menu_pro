// __tests__/setup.ts
// Global test setup — mock external dependencies
import { vi } from "vitest";

// ─── Mock auth module ───
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// ─── Mock prisma ───
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    restaurant: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    category: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    item: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    itemSize: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    itemExtra: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    itemImage: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    order: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    orderItem: { create: vi.fn() },
    table: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), createMany: vi.fn() },
    notification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
    analyticsEvent: { create: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    rating: { findMany: vi.fn(), create: vi.fn(), aggregate: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      order: { findFirst: vi.fn(), create: vi.fn() },
      category: { update: vi.fn() },
      item: { update: vi.fn(), create: vi.fn(), createMany: vi.fn() },
    })),
  },
}));
