# HealthWatch NG

A public-health analytics platform for **Nigerian disease outbreak monitoring**, built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and Recharts.

> Demo application — all data in `src/lib/mockData.ts` is synthetic but realistic
> (all 36 states + FCT, real LGA names, NCDC-style surveillance figures).

## Modules

| Route | Module | Owner role |
| --- | --- | --- |
| `/dashboard` | Disease Surveillance Dashboard — summary stats, 12-week case trends, state risk heat-grid, recent alerts | ML Engineer / Data Scientist |
| `/alerts` | Outbreak Alert Management — filterable alerts table with a detail slide-over and acknowledge action | Backend / Platform Engineer |
| `/admin` | Admin Panel — Users, Data Sources and Audit Log tabs | System Admin / Platform Engineer |
| `/portal` | Public Health Officer Portal — 4-week forecast with confidence band, high-risk LGAs, weekly epi report | Health Officer / Epidemiologist |

All four pages share a sidebar + top-navbar shell (`src/components/layout`).

## Design system

- **Brand:** Nigerian green `#006B3F`
- **Risk levels:** Low `#059669` · Medium `#D97706` · High `#DC2626` · Critical `#7C3AED`
- Tokens live in `src/app/globals.css` (`@theme`) and `src/lib/theme.ts`.

## Project structure

```
src/
  app/
    (app)/              # shared dashboard layout (sidebar + navbar)
      dashboard | alerts | admin | portal
    layout.tsx          # root layout
    page.tsx            # redirects to /dashboard
  components/           # ui / layout / dashboard / alerts / admin / portal
  lib/                  # mockData, theme, nav, utils
  types/health.ts       # all domain interfaces (no `any`)
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```
# healthwatch_ng
