# AjoTrack

A digital passbook app for cooperative/Ajo/Thrift societies. Members log in to view their own contribution history; admins manage all members, record transactions, and export reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/contribution-app run dev` — Frontend (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec (**see Gotchas below**)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — express-session secret

## Seeded credentials (dev)
- Admin: `username=admin` / `password=admin123`
- Member: contribution number `JMX001` / PIN `1234` (John Maxwell, 7 sample transactions)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React + Vite + shadcn/ui + Tailwind v4 + `wouter` routing
- **API**: Express 5 (port 8080), session-based auth via `express-session` + `bcryptjs`
- **DB**: PostgreSQL + Drizzle ORM — tables: `members`, `transactions`, `admins`
- **API contract**: OpenAPI spec at `lib/api-spec/openapi.yaml` → Orval codegen → `lib/api-client-react` (React Query hooks) + `lib/api-zod` (Zod schemas)
- **Build**: esbuild (API), Vite (frontend)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (`members`, `transactions`, `admins`)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — `requireAuth`, `requireAdmin`, `requireMemberOrAdmin`
- `artifacts/api-server/src/lib/balances.ts` — `recalcBalances(memberId)` — recalculates running balances after any mutation
- `artifacts/contribution-app/src/pages/` — member passbook + admin dashboard/members/reports
- `artifacts/contribution-app/src/components/layouts/` — `AdminLayout`, `MemberLayout`
- `lib/api-client-react/src/custom-fetch.ts` — fetch wrapper (adds `credentials: "include"`)

## Architecture decisions

- Sessions stored in memory (express-session default). Suitable for single-instance deploy; swap to pg-session-store for multi-instance.
- PINs are optional — a member with no PIN can log in with contribution number alone.
- `recalcBalances` recalculates all running balances for a member on every transaction mutation to keep them consistent.
- Zod v3 workspace but Orval v8 generates Zod v4 syntax — requires a post-codegen patch (see Gotchas).

## Product

Two roles:
- **Member** — logs in with contribution number + optional PIN, sees their own passbook (balance card, full ledger with search/date filter, printable).
- **Admin** — manages members (add/edit/delete/status), records credit/debit transactions per member, views financial summary reports, exports member CSV.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **After every `codegen` run**, two patches must be re-applied:
  1. `sed -i 's/zod\.int()/zod.number().int()/g' lib/api-zod/src/generated/api.ts` — fixes Zod v4 syntax
  2. Overwrite `lib/api-zod/src/index.ts` to only `export * from './generated/api'` — prevents TS2308 collision on `ListMemberTransactionsParams`
- `import "./types/session"` must NOT appear in `app.ts` — esbuild can't bundle `.d.ts` files. Session type augmentation works via `tsconfig.json` `include: ["src"]`.
- All API calls need `credentials: "include"` (set in custom-fetch) so session cookies are sent cross-origin.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
