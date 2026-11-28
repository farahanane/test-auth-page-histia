import { expect, test } from "@playwright/test";

// REQ-10: /login plus /fr/* and /en/*; ASSUME-1: default French unless the browser prefers English.

test.describe("locale routing", () => {
  test.describe("with a browser preferring neither French nor English", () => {
    test.use({ locale: "de-DE" });

    test("a bare /login goes to the French login (default)", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/fr\/login$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "fr");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ravi de vous revoir sur Stolos !");
    });

    test("the site root goes to the login page", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/fr\/login$/);
    });
  });

  test("/en/login is in English", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back to Stolos!");
  });

  test("/fr/login is in French", async ({ page }) => {
    await page.goto("/fr/login");
    await expect(page).toHaveURL(/\/fr\/login$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test.describe("with an English browser", () => {
    test.use({ locale: "en-US" });

    test("a bare /login goes to the English login", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/en\/login$/);
    });
  });

  test("an unknown page answers 404 with a translated message", async ({ page }) => {
    const response = await page.goto("/en/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("an unsupported locale ends on the 404 page", async ({ page }) => {
    const response = await page.goto("/de/login");
    expect(response?.status()).toBe(404);
  });
});

test.describe("routes outside the locale", () => {
  test("/code is served as is", async ({ page }) => {
    const response = await page.goto("/code");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/code$/);
  });

  test("the auth API is not redirected", async ({ request }) => {
    const response = await request.get("/api/auth/get-session", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});
