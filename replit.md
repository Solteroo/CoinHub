# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

This workspace contains the **CoinHub** project — a virtual coin economy game platform in Türkmen language with a mobile-app PWA aesthetic and a dark + gold premium theme.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 19 + Vite + Wouter + TanStack Query + Tailwind + Framer Motion

## Artifacts

- `artifacts/coinhub` — CoinHub PWA frontend (web, previewPath `/`)
- `artifacts/api-server` — Express API backend
- `artifacts/mockup-sandbox` — design canvas

## CoinHub Features

- Auth: register/login (username + password, scrypt hashed, cookie sessions `coinhub_sid`)
- New users start with **200 coins** and a unique 8-digit numeric `publicId` (e.g. `81036355`)
- 4 wager-based casino games (all with house edge, RTP ~85–96%):
  - **Slot Maşyn** (3-reel slot, jackpot 150×)
  - **Bagt Çarhy** (12-segment wheel, top prize 100×)
  - **Bagt Gutusy** (9 mystery boxes, max 50× pick)
  - **Bagt Uçuşy** (rocket crash with auto-cashout, target 1.1×–50×, ~96% RTP)
- Min bet 10, max bet 100 000
- **No daily bonus** — to top up coins, players must contact the admin via Phone/IMO
- **Global Çat** — all logged-in users can chat in one room (200-char limit, 1.5s cooldown). Polls every 2.5s. Admin can delete messages.
- Leaderboard (top 100), Wallet (transaction history), Profile (with copyable numeric ID + VIP contact links)
- Bottom nav: Baş sahypa / Oýunlar / **Çat (center floating button)** / Gapjyk / Profil
- Admin panel at `/admin` (separate password-only session, cookie `coinhub_admin`)
  - Dashboard stats, user lookup (by username or numeric ID), manual coin add/subtract, transaction log

## Admin Access

- Admin password is read from the `ADMIN_PASSWORD` env var. **Default fallback: `admin123`** (set the env var in production!).
- Admin login endpoint: `POST /api/admin/login` with `{ password }`.

## Brand / Contact

- Brand: **CoinHub**
- Phone: **+99361403543**
- IMO: **+918826816138**
- Language: Türkmen (UI copy is fully localized)
- No real payments, no crypto

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/coinhub run dev` — run CoinHub frontend locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
