import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, type Page } from "@playwright/test";

const TEST_CODE = "424242";

export function testEmail() {
  return `groovevault-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}+clerk_test@example.com`;
}

export async function signUpTestUser(page: Page) {
  await setupClerkTestingToken({ page });
  const email = testEmail();

  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page
    .getByRole("textbox", { name: /password/i })
    .fill(`Groove-${Date.now()}!`);
  const preparedVerification = page.waitForResponse(
    (resp) =>
      resp.url().includes("prepare_verification") && resp.status() === 200,
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await preparedVerification;
  await page
    .getByRole("textbox", { name: /code/i })
    .pressSequentially(TEST_CODE);

  await expect(page).toHaveURL(/\/collection/, { timeout: 30_000 });
  return email;
}
