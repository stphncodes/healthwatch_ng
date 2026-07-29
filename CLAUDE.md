# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

HealthWatch NG — a public-health analytics dashboard for Nigerian disease-outbreak surveillance (Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, Recharts 3, Supabase). The app is **Supabase-ready with graceful fallback**: without `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`) it runs in local demo mode — browser-only auth and empty datasets (every view has an empty state). With the env vars set, auth goes through Supabase Auth and every dataset is fetched from the tables in `supabase/schema.sql`. There is no synthetic/mock data anywhere.

## Commands

```bash
npm run dev      # dev server with hot reload → http://localhost:3000 (redirects to /dashboard)
npm run build    # production build (also the de-facto typecheck gate)
npm run start    # serve the production build
npm run lint     # ESLint 9 (eslint-config-next)
```

There is no test runner configured — `npm run build` and `npm run lint` are the verification steps. To go live against Supabase: copy `.env.example` to `.env.local`, fill both vars, and run `supabase/schema.sql` in the project's SQL editor.

## Architecture

Three guarded app pages, one standalone admin console, one shared shell, one data-flow pattern:

- **Routes** live under the `src/app/(app)/` route group — `/dashboard`, `/alerts`, `/portal` — whose `layout.tsx` wraps everything in `AuthGuard` + `AppShell` (Sidebar + Topbar) and exports `dynamic = "force-dynamic"` so data is fetched per-request. `/login` and `/signup` are public. Routes are defined once in `src/lib/nav.ts`. **`/admin` is a standalone route outside the group** (`src/app/admin`) with its own sign-in screen (`AdminConsole`): admins authenticate at `/admin` directly, non-admin accounts are shown a no-access screen, and the admin console is absent from the app sidebar.
- **Data flow**: async server-component pages call the getters in `src/lib/data.ts` (`getOutbreakAlerts`, `getStateRisks`, …) and pass results as props to presentational components under `src/components/<feature>/`. Each getter queries a Supabase table (snake_case rows mapped onto the camelCase contracts in `src/types/health.ts`) or resolves empty when Supabase isn't configured. Dashboard headline stats are **derived** from the fetched datasets, not stored. Components must not fetch or import data themselves — data enters via props; empty arrays render `EmptyState` (`src/components/ui/EmptyState.tsx`).
- **Auth (dual-mode)**: `src/lib/auth.ts` picks per `isSupabaseConfigured` — Supabase mode uses `supabase.auth` (signUp carries name/role/state/phone as user metadata, mirrored to `profiles` by a DB trigger; email-confirmation flows are handled on the signup form); local mode stores self-registered accounts in localStorage with SHA-256-hashed passwords. Both modes expose the session through one subscribe/snapshot pair consumed by `AuthProvider` via `useSyncExternalStore` (cross-tab sync included). `AuthGuard` redirects signed-out visitors to `/login?next=…`. Login/signup share the `AuthScreen` frame and `fieldStyles.ts` input classes.
- **Registration approval (Supabase mode)**: new signups collect an 11-digit NIN plus two document photos (NIN slip, work ID — compressed client-side via `src/lib/images.ts`) and are held `pending` until a **Super Admin** (role above System Admin; groupings in `src/lib/roles.ts`) approves them from the Pending Approvals tab in the Admin Console — login is blocked until approved. Local demo mode auto-approves signups (no backend → no admin to review). **Admin accounts are provisioned by SQL only** (`supabase/promote_admin.sql`) — no UI path, no seeded accounts, and the signup trigger clamps client-supplied roles to non-admin. The approvals tab is the one documented exception to "components don't fetch": `src/lib/approvals.ts` runs in the browser because identity documents (PII in `identity_documents` + a private `identity-documents` storage bucket) are Super-Admin-gated by RLS and must never ride the anon server path. Approve/reject goes through the `review_user()` RPC; existing DBs migrate via `supabase/migrations/20260729_user_approval.sql`.
- **Server-side reads are anonymous**: server components fetch with the anon key (the browser auth session is not forwarded), so `schema.sql` grants SELECT to the anon role. Tightening this means migrating to `@supabase/ssr` cookie sessions.
- **Domain contracts**: every domain type lives in `src/types/health.ts`; strict no-`any` policy. `src/lib/states.ts` holds the static 36-states+FCT reference list (facts, not data).

## Design system conventions

- Colour has a **dual-token setup**: static Tailwind tokens are declared in `src/app/globals.css` (`@theme`, e.g. `bg-brand`), while `src/lib/theme.ts` holds runtime colour maps (`RISK_STYLES`, `STATUS_STYLES`, `ROLE_STYLES`, `DISEASE_COLORS`) applied as **inline styles** for values derived from data — Tailwind can't generate classes from dynamic strings. When colouring by a domain value (risk, status, role, disease), use the `theme.ts` maps, never hand-picked hex codes.
- Use the `cn()` helper from `src/lib/utils.ts` for conditional class names; date/number formatting helpers (`formatNumber`, `timeAgo`, `formatDate`, `formatDateTime`) also live there.
- Source files open with a `// Module: ... | Owner: ...` header comment; keep that convention for new files.
