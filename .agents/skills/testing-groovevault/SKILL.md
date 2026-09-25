---
name: testing-groovevault
description: How to run GrooveVault locally and test authenticated flows without hitting Clerk's captcha. Use when testing any page behind sign-in, or when adding end-to-end tests.
---

# Testing GrooveVault

## Running the app

Node 22 is required (`source ~/.nvm/nvm.sh && nvm use 22`).

```bash
npm install
npm run dev    # http://localhost:3000
```

Clerk keys live in `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`),
copied from `.env.example`. They are development instance keys stored as repo-scoped
Devin secrets — never commit them.

## Signing in during tests

Do not try to sign up through a normal automated browser: Clerk's bot protection shows
a Cloudflare Turnstile captcha that automation cannot pass.

Use the Playwright suite instead:

```bash
npx playwright install chromium   # once per machine
npm run test:e2e
```

It works because of two Clerk testing features:

- `e2e/global.setup.ts` calls `clerkSetup()` from `@clerk/testing/playwright`, which
  fetches a Testing Token; each test calls `setupClerkTestingToken({ page })` to attach
  it, bypassing the captcha.
- Test accounts use the `+clerk_test` email subaddress (e.g.
  `groovevault-1712345+clerk_test@example.com`) and always verify with the code `424242`,
  so no real email is sent. Generate a unique local part per run to avoid collisions.
- The dev instance caps at 100 users, and each test signs up a fresh account. A Playwright
  global teardown (`e2e/global.teardown.ts`) deletes `+clerk_test` users after every run;
  if a run is killed before teardown, sweep stragglers with `npm run test:clean-users`.
  Sign-up failures with "You have reached your limit of 100 users" mean that cap was hit.

## Selector notes for Clerk components

Clerk's markup changes between versions; these were correct for `@clerk/nextjs` v7 (Core 3):

- Sign-up submit is `getByRole("button", { name: "Continue", exact: true })` — a
  non-exact match also hits the Google social button.
- Entering the OTP races Clerk's `prepare_verification` request — wait for that
  response after clicking Continue, then use `pressSequentially` (not `fill`) so
  auto-submit fires reliably. Skipping the wait leaves tests stuck on
  `/sign-up/verify-email-address` until timeout (see `e2e/helpers.ts`).
- The password field is `getByRole("textbox", { name: /password/i })`; `getByLabel`
  also matches the show/hide toggle.
- The `UserButton` trigger is `getByRole("button", { name: /open user menu/i })`, and
  the sign-out control inside it has no accessible name — click it via
  `getByRole("dialog").getByText(/sign out/i)`.
- After signing out, wait for the header Sign in button before asserting that a
  protected route redirects; navigating immediately races the session teardown.

## Protected routes

`src/proxy.ts` protects everything except `/`, `/sign-in`, `/sign-up`. Anonymous
requests to a protected route redirect to `/sign-in?redirect_url=...`.
