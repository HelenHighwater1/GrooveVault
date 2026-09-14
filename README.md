# GrooveVault

Vinyl collection management app. Next.js (App Router) + TypeScript + Tailwind, with authentication by [Clerk](https://clerk.com).

## Getting started

```bash
cp .env.example .env.local   # fill in your Clerk keys from https://dashboard.clerk.com
npm install
npm run dev
```

Open http://localhost:3000.

## Auth

- `src/proxy.ts` runs `clerkMiddleware` and protects every route except `/`, `/sign-in`, `/sign-up`.
- `/sign-in` and `/sign-up` render Clerk's hosted components as catch-all routes.
- `/collection` is a protected page reading the signed-in user with `currentUser()`.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
