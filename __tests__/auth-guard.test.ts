// __tests__/auth-guard.test.ts
// Tests for centralized DB-verified authentication
import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/auth-guard";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);

describe("getAuthUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await getAuthUser();
    expect(result).toBeNull();
  });

  it("returns null when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as any);
    const result = await getAuthUser();
    expect(result).toBeNull();
  });

  it("returns null when user not found in DB", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    mockFindUnique.mockResolvedValue(null);
    const result = await getAuthUser();
    expect(result).toBeNull();
  });

  it("returns null when user is deactivated", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    mockFindUnique.mockResolvedValue({ id: "user-1", role: "ADMIN", isActive: false } as any);
    const result = await getAuthUser();
    expect(result).toBeNull();
  });

  it("returns user when active and valid", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    mockFindUnique.mockResolvedValue({ id: "user-1", role: "ADMIN", isActive: true } as any);
    const result = await getAuthUser();
    expect(result).toEqual({ id: "user-1", role: "ADMIN", isActive: true });
  });

  it("reads from DB — not from JWT role", async () => {
    // JWT says ADMIN but DB says RESTAURANT_OWNER
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } } as any);
    mockFindUnique.mockResolvedValue({ id: "user-1", role: "RESTAURANT_OWNER", isActive: true } as any);
    const result = await getAuthUser();
    expect(result?.role).toBe("RESTAURANT_OWNER"); // DB wins
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for non-admin user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    mockFindUnique.mockResolvedValue({ id: "user-1", role: "RESTAURANT_OWNER", isActive: true } as any);
    const result = await requireAdmin();
    expect(result).toBeNull();
  });

  it("returns user for admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } } as any);
    mockFindUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN", isActive: true } as any);
    const result = await requireAdmin();
    expect(result).toEqual({ id: "admin-1", role: "ADMIN", isActive: true });
  });

  it("returns null for deactivated admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } } as any);
    mockFindUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN", isActive: false } as any);
    const result = await requireAdmin();
    expect(result).toBeNull();
  });
});
