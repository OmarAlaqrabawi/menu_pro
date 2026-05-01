// e2e/public-menu.spec.ts
// E2E tests for public menu + orders + ratings API
import { test, expect } from "@playwright/test";

test.describe("Public Menu API", () => {
  test("GET /api/menu/:slug returns menu data or 404", async ({ request }) => {
    const res = await request.get("/api/menu/test-restaurant");
    // Either 200 (if restaurant exists) or 404
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty("restaurant");
    }
  });
});

test.describe("Orders API Security", () => {
  test("POST /api/orders rejects empty body", async ({ request }) => {
    const res = await request.post("/api/orders", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/orders rejects invalid orderType", async ({ request }) => {
    const res = await request.post("/api/orders", {
      data: {
        restaurantId: "fake-id",
        orderType: "INVALID_TYPE",
        items: [{ itemId: "x", quantity: 1 }],
      },
    });
    expect([400, 404]).toContain(res.status());
  });

  test("POST /api/orders rejects non-existent restaurant", async ({ request }) => {
    const res = await request.post("/api/orders", {
      data: {
        restaurantId: "non-existent-restaurant-id",
        orderType: "DINE_IN",
        items: [{ itemId: "fake-item", quantity: 1 }],
      },
    });
    expect([400, 404, 500]).toContain(res.status());
  });
});

test.describe("Ratings API Security", () => {
  test("POST /api/ratings rejects invalid data", async ({ request }) => {
    const res = await request.post("/api/ratings", {
      data: { restaurantId: "", stars: 0 },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/ratings rejects stars > 5", async ({ request }) => {
    const res = await request.post("/api/ratings", {
      data: { restaurantId: "test", stars: 10 },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/ratings rejects non-existent restaurant", async ({ request }) => {
    const res = await request.post("/api/ratings", {
      data: { restaurantId: "fake-restaurant-id", stars: 4, comment: "test" },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe("Analytics API Security", () => {
  test("POST /api/analytics/track rejects invalid eventType", async ({ request }) => {
    const res = await request.post("/api/analytics/track", {
      data: { restaurantId: "test", eventType: "HACKED_EVENT" },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("Protected Endpoints", () => {
  test("GET /api/menu/export requires auth", async ({ request }) => {
    const res = await request.get("/api/menu/export?restaurantId=test");
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/menu/image requires auth", async ({ request }) => {
    const res = await request.post("/api/menu/image", {
      data: { itemId: "test", imageUrl: "https://example.com/img.jpg" },
    });
    expect([401, 403]).toContain(res.status());
  });
});
