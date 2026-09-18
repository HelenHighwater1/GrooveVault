<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Checks (must pass before committing)

- `npm run lint` — ESLint
- `npm run typecheck` — runs `next typegen` first (generated route types like `LayoutProps` live in `.next/`, so plain `tsc` fails on a fresh checkout)
- `npm run format:check` — Prettier (fix with `npm run format`)
- `npm run build` — requires the `NEXT_PUBLIC_CLERK_*` vars (see `.env.example` / `fly.toml`)
- `npm run test:e2e` — Playwright auth suite (see `.agents/skills/testing-groovevault/`)

# Workflow

- All changes to `main` go through a PR — branch protection requires green `ci` + `e2e` checks; approvals are not required (solo repo — GitHub never lets the author approve their own PR). Greptile reviews every PR (config: `greptile.json`).
