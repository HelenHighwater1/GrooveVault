import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

const TEST_CODE = "424242";

function testEmail() {
  return `groovevault-${Date.now()}+clerk_test@example.com`;
}

test("anonymous visitors cannot reach the collection", async ({ page }) => {
  await setupClerkTestingToken({ page });

  await page.goto("/collection");

  await expect(page).toHaveURL(/\/sign-in/);
});

test("a new user can sign up and reach their collection", async ({ page }) => {
  await setupClerkTestingToken({ page });
  const email = testEmail();

  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page
    .getByRole("textbox", { name: /password/i })
    .fill(`Groove-${Date.now()}!`);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await page.getByRole("textbox", { name: /code/i }).fill(TEST_CODE);

  await expect(page).toHaveURL(/\/collection/, { timeout: 30_000 });
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: /open user menu/i }).click();
  await page
    .getByRole("dialog")
    .getByText(/sign out/i)
    .click();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();

  await page.goto("/collection");
  await expect(page).toHaveURL(/\/sign-in/);
});
