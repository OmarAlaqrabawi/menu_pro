// e2e/auth.spec.ts
// E2E tests for authentication flow
import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("shows login page with form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email'], input[name='email']", "wrong@test.com");
    await page.fill("input[type='password']", "wrongpassword");
    await page.click("button[type='submit']");
    // Should show error message
    await page.waitForTimeout(2000);
    const errorText = await page.locator("[role='alert'], .error, [class*='error'], p[style*='color']").first();
    await expect(errorText).toBeVisible({ timeout: 5000 });
  });

  test("redirects unauthenticated users from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await page.waitForURL(/login|auth/, { timeout: 5000 });
    expect(page.url()).toContain("login");
  });
});

test.describe("Security Headers", () => {
  test("includes security headers", async ({ page }) => {
    const response = await page.goto("/login");
    const headers = response?.headers() ?? {};

    // Check for security headers set in next.config.ts
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
  });
});
