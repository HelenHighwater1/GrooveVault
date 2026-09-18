import { expect, test } from "@playwright/test";
import { signUpTestUser } from "./helpers";

test("a user can add a record manually", async ({ page }) => {
  await signUpTestUser(page);

  await expect(
    page.getByRole("link", { name: /add your first record/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /add your first record/i }).click();
  await expect(page).toHaveURL(/\/collection\/add/);

  await page.getByRole("button", { name: /enter it manually/i }).click();
  await page.getByLabel(/artist/i).fill("Can");
  await page.getByLabel(/title/i).fill("Tago Mago");
  await page.getByLabel(/year/i).fill("1971");
  await page.getByRole("button", { name: /add to collection/i }).click();

  await expect(page.getByText(/added can – tago mago/i)).toBeVisible();

  await page.getByRole("link", { name: /view collection/i }).click();
  await expect(page).toHaveURL(/\/collection$/);
  await expect(page.getByText("Tago Mago")).toBeVisible();
  await expect(page.getByText("Can", { exact: true })).toBeVisible();
});

test("a user can find a record via Discogs search", async ({ page }) => {
  test.skip(
    !process.env.DISCOGS_TOKEN,
    "DISCOGS_TOKEN not set — Discogs search is disabled",
  );
  await signUpTestUser(page);

  await page.goto("/collection/add");
  await page.getByRole("searchbox").fill("fleetwood mac rumours");
  await page.getByRole("button", { name: /^look up$/i }).click();

  const result = page.getByRole("button", { name: /rumours/i }).first();
  await expect(result).toBeVisible({ timeout: 15_000 });
  await result.click();

  // The confirm form is prefilled from the release detail.
  await expect(page.getByLabel(/artist/i)).toHaveValue(/fleetwood mac/i);
  await page.getByRole("button", { name: /add to collection/i }).click();
  await expect(page.getByText(/added .*rumours/i)).toBeVisible();

  // Searching again flags results that share the owned master.
  await page.getByRole("button", { name: /add another/i }).click();
  await page.getByRole("searchbox").fill("fleetwood mac rumours");
  await page.getByRole("button", { name: /^look up$/i }).click();
  await expect(page.getByText(/in your collection/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
