// __tests__/validators.test.ts
// Unit tests for all Zod validation schemas
import { describe, it, expect } from "vitest";
import {
  createCategorySchema, updateCategorySchema,
  createItemSchema, updateItemSchema,
  createItemSizeSchema, createItemExtraSchema, reorderSchema,
} from "@/validators/menu";
import { createRestaurantSchema, updateRestaurantSchema, updatePermissionsSchema } from "@/validators/restaurant";
import { createTableSchema, updateTableSchema, bulkCreateTablesSchema } from "@/validators/table";
import { updateOrderStatusSchema, createOrderSchema } from "@/validators/order";
import { loginSchema, registerSchema } from "@/validators/auth";

// ═══════════════ Auth Validators ═══════════════

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "admin@test.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Test User", email: "test@test.com", password: "Str0ngP@ss!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = registerSchema.safeParse({
      name: "Test", email: "t@t.com", password: "weakpass1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no number)", () => {
    const result = registerSchema.safeParse({
      name: "Test", email: "t@t.com", password: "WeakPass!",
    });
    expect(result.success).toBe(false);
  });
});

// ═══════════════ Menu Validators ═══════════════

describe("createCategorySchema", () => {
  it("accepts valid category", () => {
    const result = createCategorySchema.safeParse({
      restaurantId: "rest-123", nameAr: "المشويات",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty nameAr", () => {
    const result = createCategorySchema.safeParse({
      restaurantId: "rest-123", nameAr: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing restaurantId", () => {
    const result = createCategorySchema.safeParse({ nameAr: "test" });
    expect(result.success).toBe(false);
  });

  it("accepts schedule types", () => {
    const result = createCategorySchema.safeParse({
      restaurantId: "r1", nameAr: "فطور",
      scheduleType: "BREAKFAST",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid schedule type", () => {
    const result = createCategorySchema.safeParse({
      restaurantId: "r1", nameAr: "test",
      scheduleType: "INVALID_TYPE",
    });
    expect(result.success).toBe(false);
  });
});

describe("createItemSchema", () => {
  it("accepts valid item", () => {
    const result = createItemSchema.safeParse({
      categoryId: "cat-1", nameAr: "برجر", price: 5.0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = createItemSchema.safeParse({
      categoryId: "cat-1", nameAr: "test", price: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts badge enum values", () => {
    for (const badge of ["NEW", "POPULAR", "OFFER"]) {
      const result = createItemSchema.safeParse({
        categoryId: "cat-1", nameAr: "test", price: 1, badge,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid badge", () => {
    const result = createItemSchema.safeParse({
      categoryId: "cat-1", nameAr: "test", price: 1, badge: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

// ═══════════════ Order Validators ═══════════════

describe("createOrderSchema", () => {
  it("accepts valid order", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest-1",
      orderType: "DINE_IN",
      items: [{ itemId: "item-1", itemName: "برجر", quantity: 2, unitPrice: 5 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest-1", orderType: "DINE_IN", items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid orderType", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest-1", orderType: "INVALID",
      items: [{ itemId: "x", itemName: "y", quantity: 1, unitPrice: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "r", orderType: "TAKEAWAY",
      items: [{ itemId: "x", itemName: "y", quantity: 0, unitPrice: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateOrderStatusSchema", () => {
  it("accepts valid status transitions", () => {
    for (const status of ["NEW", "PREPARING", "READY", "COMPLETED", "CANCELLED"]) {
      const result = updateOrderStatusSchema.safeParse({ orderId: "ord-1", status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = updateOrderStatusSchema.safeParse({ orderId: "ord-1", status: "DELIVERED" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════ Restaurant Validators ═══════════════

describe("createRestaurantSchema", () => {
  it("accepts valid restaurant", () => {
    const result = createRestaurantSchema.safeParse({
      nameAr: "مطعم الشام", slug: "al-sham",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty nameAr", () => {
    const result = createRestaurantSchema.safeParse({ nameAr: "", slug: "test" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════ Table Validators ═══════════════

describe("createTableSchema", () => {
  it("accepts valid table", () => {
    const result = createTableSchema.safeParse({
      restaurantId: "rest-1", tableNumber: "T1",
    });
    expect(result.success).toBe(true);
  });
});

describe("bulkCreateTablesSchema", () => {
  it("accepts valid bulk create", () => {
    const result = bulkCreateTablesSchema.safeParse({
      restaurantId: "r1", count: 10, startNumber: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero count", () => {
    const result = bulkCreateTablesSchema.safeParse({
      restaurantId: "r1", count: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ═══════════════ Reorder Validator ═══════════════

describe("reorderSchema", () => {
  it("accepts valid reorder data", () => {
    const result = reorderSchema.safeParse({
      items: [
        { id: "a", sortOrder: 0 },
        { id: "b", sortOrder: 1 },
        { id: "c", sortOrder: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative sortOrder", () => {
    const result = reorderSchema.safeParse({
      items: [{ id: "a", sortOrder: -1 }],
    });
    expect(result.success).toBe(false);
  });
});
