import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signUpTestUser, testEmail } from "./helpers";

// Two full sign-up flows plus several navigations per test.
test.describe.configure({ timeout: 90_000 });

async function renameVault(page: Page, name: string) {
  await page.goto("/collection");
  await page.getByLabel(/collection name/i).fill(name);
  await page.getByRole("button", { name: "Rename" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

async function addRecordManually(page: Page, artist: string, title: string) {
  await page.getByRole("link", { name: /add your first record/i }).click();
  await page.getByRole("button", { name: /enter it manually/i }).click();
  await page.getByLabel(/artist/i).fill(artist);
  await page.getByLabel(/title/i).fill(title);
  await page.getByRole("button", { name: /add to collection/i }).click();
  await expect(
    page.getByText(new RegExp(`added ${artist}`, "i")),
  ).toBeVisible();
}

async function createInviteLink(page: Page): Promise<string> {
  await page.getByRole("button", { name: /invite someone/i }).click();
  await page.getByRole("button", { name: /create invite link/i }).click();
  const url = await page.getByLabel(/invite link/i).inputValue();
  expect(url).toContain("/invite/");
  return url;
}

test("a member can join a shared vault and merge their records", async ({
  browser,
}) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  try {
    await signUpTestUser(pageA);
    await renameVault(pageA, "Hi-Fi Den");
    const url = await createInviteLink(pageA);

    await signUpTestUser(pageB);
    await addRecordManually(pageB, "Can", "Tago Mago");

    await pageB.goto(url);
    await expect(
      pageB.getByRole("heading", { name: /join hi-fi den/i }),
    ).toBeVisible();
    await pageB
      .getByRole("button", { name: /join and merge my 1 record/i })
      .click();
    await expect(pageB).toHaveURL(/\/collection$/);

    // B lands on the shared vault holding their merged record; their
    // personal vault is gone, so there is no switcher.
    await expect(
      pageB.getByRole("heading", { name: "Hi-Fi Den" }),
    ).toBeVisible();
    await expect(pageB.getByText("Tago Mago")).toBeVisible();
    await expect(pageB.getByText(/members/i).first()).toBeVisible();
    await expect(pageB.getByLabel(/switch vault/i)).toHaveCount(0);

    // A sees the merged record and two members.
    await pageA.goto("/collection");
    await expect(pageA.getByText("Tago Mago")).toBeVisible();
    await expect(pageA.getByText(/members/i).first()).toBeVisible();
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});

test("a member can join and keep both vaults separate", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  try {
    await signUpTestUser(pageA);
    await renameVault(pageA, "Hi-Fi Den");
    const url = await createInviteLink(pageA);

    await signUpTestUser(pageB);
    await addRecordManually(pageB, "Can", "Tago Mago");

    await pageB.goto(url);
    await pageB
      .getByRole("button", { name: /join and keep my vault/i })
      .click();
    await expect(pageB).toHaveURL(/\/collection$/);

    // B is on the shared vault; their personal record did not move, and the
    // switcher offers both vaults.
    await expect(
      pageB.getByRole("heading", { name: "Hi-Fi Den" }),
    ).toBeVisible();
    await expect(pageB.getByText("Tago Mago")).toHaveCount(0);

    const switcher = pageB.getByLabel(/switch vault/i);
    await expect(switcher).toBeVisible();
    await expect(
      switcher.getByRole("option", { name: /my collection/i }),
    ).toHaveCount(1);

    // Switching back shows the untouched personal record.
    await switcher.selectOption({ label: "My collection" });
    await expect(pageB.getByText("Tago Mago")).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});

test("an anonymous invitee can sign up from the invite link", async ({
  browser,
}) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  try {
    await signUpTestUser(pageA);
    await renameVault(pageA, "Hi-Fi Den");
    const url = await createInviteLink(pageA);

    // B has no session — the invite link should bounce through sign-in and
    // carry them back to the same invitation after signing up.
    await setupClerkTestingToken({ page: pageB });
    await pageB.goto(url);
    await expect(pageB).toHaveURL(/sign-in/);
    await pageB.getByRole("link", { name: /sign up/i }).click();

    await pageB.getByRole("textbox", { name: /email/i }).fill(testEmail());
    await pageB
      .getByRole("textbox", { name: /password/i })
      .fill(`Groove-${Date.now()}!`);
    const preparedVerification = pageB.waitForResponse(
      (resp) =>
        resp.url().includes("prepare_verification") && resp.status() === 200,
    );
    await pageB.getByRole("button", { name: "Continue", exact: true }).click();
    await preparedVerification;
    await pageB
      .getByRole("textbox", { name: /code/i })
      .pressSequentially("424242");

    await expect(pageB).toHaveURL(/\/invite\//, { timeout: 30_000 });
    await expect(
      pageB.getByRole("heading", { name: /join hi-fi den/i }),
    ).toBeVisible();
    await pageB.getByRole("button", { name: /join vault/i }).click();
    await expect(pageB).toHaveURL(/\/collection$/);
    await expect(
      pageB.getByRole("heading", { name: "Hi-Fi Den" }),
    ).toBeVisible();
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
