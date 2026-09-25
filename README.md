# GrooveVault

Vinyl collection management app. Next.js (App Router) + TypeScript + Tailwind, with authentication by [Clerk](https://clerk.com).

## Getting started

```bash
cp .env.example .env.local   # fill in your Clerk keys from https://dashboard.clerk.com
npm install
npm run dev
```

Open http://localhost:3000.

## Database

Record and collection data lives in [Supabase](https://supabase.com)
(Postgres), managed with the Supabase CLI (`brew install
supabase/tap/supabase`). The schema lives in `supabase/migrations/`.

- Fresh project: `supabase link --project-ref <ref>`, then
  `supabase db push` to apply the migrations.
- Schema changed in the dashboard? `supabase db pull` captures it as a
  new migration.
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
  (and as Fly.io secrets for production). The app uses the service role
  key server-side only.

## Auth

- `src/proxy.ts` runs `clerkMiddleware` and protects every route except `/`, `/sign-in`, `/sign-up`.
- `/sign-in` and `/sign-up` render Clerk's hosted components as catch-all routes.
- `/collection` is a protected page reading the signed-in user with `currentUser()`.

## End-to-end tests

```bash
npx playwright install chromium   # once
npm run test:e2e
```

The suite drives real Clerk sign-up and sign-out against the development instance.
Two things keep it unattended:

- `@clerk/testing` fetches a Testing Token in `e2e/global.setup.ts`, which disables
  bot protection (the captcha) for the test browser.
- Emails using the `+clerk_test` subaddress are verified with the fixed code `424242`,
  so no mail is sent.

Both require development instance keys in `.env.local`.

## Deploying

Deployed on Fly.io at https://mygroovevault.com (`fly.toml`).

```bash
flyctl deploy --build-secret SENTRY_AUTH_TOKEN="$SENTRY_AUTH_TOKEN"
```

`SENTRY_AUTH_TOKEN` is a Sentry org auth token used only at build time to
upload source maps (see `.env.example`). Omit `--build-secret` and the
deploy still works — stack traces just lose source mapping.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test:e2e` — Playwright end-to-end tests
