// __tests__/actions-authz.test.ts
// Authorization tests for ALL server actions — verifies IDOR, role checks, ownership
import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

// Helper: setup auth mock for a given user
function mockUser(user: { id: string; role: string; isActive?: boolean } | null) {
  if (!user) {
    mockAuth.mockResolvedValue(null as any);
    return;
  }
  mockAuth.mockResolvedValue({ user: { id: user.id } } as any);
  mockPrisma.user.findUnique.mockResolvedValue({
    id: user.id, role: user.role, isActive: user.isActive ?? true,
  } as any);
}

// ═══════ Notification Actions ═══════
describe("Notification IDOR Prevention", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("deleteNotification only deletes own notifications", async () => {
    mockUser({ id: "user-A", role: "RESTAURANT_OWNER" });
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 } as any);

    const { deleteNotification } = await import("@/actions/notification");
    await deleteNotification("notif-from-user-B");

    // Should use deleteMany with userId constraint
    expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: "notif-from-user-B", userId: "user-A" },
    });
  });

  it("markAsRead only marks own notifications", async () => {
    mockUser({ id: "user-A", role: "RESTAURANT_OWNER" });
    mockPrisma.notification.update.mockResolvedValue({} as any);

    const { markAsRead } = await import("@/actions/notification");
    await markAsRead("notif-123");

    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "notif-123", userId: "user-A" },
      data: { isRead: true },
    });
  });

  it("getNotifications enforces limit cap", async () => {
    mockUser({ id: "user-A", role: "RESTAURANT_OWNER" });
    mockPrisma.notification.findMany.mockResolvedValue([]);

    const { getNotifications } = await import("@/actions/notification");
    await getNotifications(999999); // try to bypass

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }), // capped at 100
    );
  });
});

// ═══════ Menu Actions IDOR ═══════
describe("Menu IDOR Prevention", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getCategories returns empty for non-owner", async () => {
    mockUser({ id: "user-A", role: "RESTAURANT_OWNER" });
    // Restaurant belongs to user-B
    mockPrisma.restaurant.findUnique.mockResolvedValue({ id: "rest-1", userId: "user-B" } as any);

    const { getCategories } = await import("@/actions/menu");
    const result = await getCategories("rest-1");
    expect(result).toEqual([]);
  });

  it("getCategories works for admin", async () => {
    mockUser({ id: "admin-1", role: "ADMIN" });
    mockPrisma.category.findMany.mockResolvedValue([{ id: "cat-1" }] as any);

    const { getCategories } = await import("@/actions/menu");
    const result = await getCategories("rest-1");
    expect(result.length).toBe(1);
  });

  it("getItems returns empty for non-owner", async () => {
    mockUser({ id: "user-A", role: "RESTAURANT_OWNER" });
    mockPrisma.category.findUnique.mockResolvedValue({
      id: "cat-1", restaurantId: "rest-1",
      restaurant: { userId: "user-B" },
    } as any);

    const { getItems } = await import("@/actions/menu");
    const result = await getItems("cat-1");
    expect(result).toEqual([]);
  });
});

// ═══════ Table Actions IDOR ═══════
describe("Table IDOR Prevention", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getTables returns empty for non-owner", async () => {
    mockUser({ id: "user-A", role: "RESTAURANT_OWNER" });
    mockPrisma.restaurant.findUnique.mockResolvedValue({ id: "rest-1", userId: "user-B" } as any);

    const { getTables } = await import("@/actions/table");
    const result = await getTables("rest-1");
    expect(result).toEqual([]);
  });
});

// ═══════ Analytics trackEvent Validation ═══════
describe("Analytics trackEvent Validation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects invalid event types", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValue({ id: "rest-1" } as any);

    const { trackEvent } = await import("@/actions/analytics");
    await trackEvent({ restaurantId: "rest-1", eventType: "MALICIOUS_EVENT" });

    // Should NOT create analytics event
    expect(mockPrisma.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it("accepts valid event types", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValue({ id: "rest-1" } as any);
    mockPrisma.analyticsEvent.create.mockResolvedValue({} as any);

    const { trackEvent } = await import("@/actions/analytics");
    await trackEvent({ restaurantId: "rest-1", eventType: "MENU_VIEW" });

    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalled();
  });

  it("rejects non-existent restaurant", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValue(null);

    const { trackEvent } = await import("@/actions/analytics");
    await trackEvent({ restaurantId: "fake-id", eventType: "MENU_VIEW" });

    expect(mockPrisma.analyticsEvent.create).not.toHaveBeenCalled();
  });
});

// ═══════ Deactivated User Access ═══════
describe("Deactivated User Blocking", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("blocks deactivated user from getCategories", async () => {
    mockUser({ id: "user-1", role: "ADMIN", isActive: false });

    const { getCategories } = await import("@/actions/menu");
    const result = await getCategories("rest-1");
    expect(result).toEqual([]);
  });

  it("blocks deactivated admin from requireAdmin", async () => {
    mockUser({ id: "admin-1", role: "ADMIN", isActive: false });

    const { getAuthUser } = await import("@/lib/auth-guard");
    const result = await getAuthUser();
    expect(result).toBeNull();
  });
});
