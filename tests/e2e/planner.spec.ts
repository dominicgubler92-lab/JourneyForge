import { expect, test } from "@playwright/test";

test("searches and assembles a trip", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Find best options" }).click();

  await expect(page.getByText("Flight options")).toBeVisible();
  await expect(page.getByText("Stay options")).toBeVisible();
  await expect(page.getByText("Estimated total")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open flight booking/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open hotel booking|Open stay booking/ })).toBeVisible();
});

