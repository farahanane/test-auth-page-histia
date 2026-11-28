import { expect, test } from "@playwright/test";

test("the /code helper lists the seeded test accounts", async ({ page }) => {
  await page.goto("/code");
  await expect(page.getByRole("cell", { name: /app@example\.com/ })).toBeVisible();
});
