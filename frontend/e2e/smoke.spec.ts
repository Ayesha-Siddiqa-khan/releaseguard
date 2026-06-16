import { test, expect } from "@playwright/test";

test.describe("ReleaseGuard Smoke Tests", () => {
  test("dashboard loads and shows key elements", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/ReleaseGuard/);

    await expect(page.locator("text=Command Center")).toBeVisible();

    await expect(page.locator("text=Total Deployments")).toBeVisible();
    await expect(page.locator("text=Successful")).toBeVisible();
    await expect(page.locator("text=Failed")).toBeVisible();
    await expect(page.locator("text=Running")).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=ReleaseGuard")).toBeVisible();
    await expect(page.locator("text=Overview")).toBeVisible();
    await expect(page.locator("text=Deployments")).toBeVisible();
    await expect(page.locator("text=Environments")).toBeVisible();
    await expect(page.locator("text=Rollback Log")).toBeVisible();
    await expect(page.locator("text=Settings")).toBeVisible();
  });

  test("deployments page loads", async ({ page }) => {
    await page.goto("/deployments");

    await expect(page.locator("text=Deployment History")).toBeVisible();
    await expect(page.locator("text=All Environments")).toBeVisible();
    await expect(page.locator("text=All Statuses")).toBeVisible();
  });

  test("environments page loads", async ({ page }) => {
    await page.goto("/environments");

    await expect(page.locator("text=Environment Status")).toBeVisible();
  });

  test("rollback page loads", async ({ page }) => {
    await page.goto("/rollback");

    await expect(page.locator("text=Rollback Log")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.locator("text=Settings")).toBeVisible();
    await expect(page.locator("text=Repository")).toBeVisible();
    await expect(page.locator("text=Infrastructure")).toBeVisible();
  });

  test("no critical console errors on dashboard", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
