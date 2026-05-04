import { expect, test } from "@playwright/test";

test("searches flexible flight deals", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Airport")).toBeVisible();
  await expect(page.getByText("Next 3 months, 3-7 nights").first()).toBeVisible();
  await expect(page.getByText("Travelers").first()).toBeVisible();
  await expect(page.getByText("Budget").first()).toBeVisible();

  await page.getByRole("button", { name: "Find deals" }).click();

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator('a[href*="google.com/travel/flights"]').first()).toBeVisible();
});
