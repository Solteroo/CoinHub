# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

This workspace contains the **CoinHub** project — a premium virtual casino platform in Türkmen language with a dark + gold Stake.com-level aesthetic, full social features, and a PWA mobile experience.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React 19 + Vite + Wouter + TanStack Query + Tailwind v4 + Framer Motion

## Artifacts

- `artifacts/coinhub` — CoinHub PWA frontend (web, previewPath `/`)
- `artifacts/api-server` — Express API backend (port **3001**, proxied at `/api`)
- `artifacts/mockup-sandbox` — design canvas

## CoinHub Features

### Auth & Economy
- Register/login (username + password, scrypt hashed, cookie sessions `coinhub_sid`)
- New users start with **100 TMT** (STARTING_COINS=100) and unique 8-digit `publicId`
- **Bonus**: 50 TMT every 3 days (BONUS_AMOUNT=50, BONUS_INTERVAL=3 days) via `/me/claim-bonus`
- Min bet 5 TMT, max bet 10,000 TMT
- No real payments, no crypto — TMT is virtual entertainment currency

### 9 Casino Games
- **Slot Maşyn** — 3-reel classic slot, jackpot 150×
- **Bagt Çarhy** — 12-segment wheel, top prize 100×
- **Bagt Gutusy** — 9 mystery boxes, max 50×
- **Bagt Uçuşy** — rocket crash, auto-cashout, ~96% RTP
- **Zar** — dice game (high/low), pick range
- **Minalar** — minesweeper-style, pick safe cells
- **Ruletka** — red/black/zero European roulette
- **Plinko** — peg board drop multipliers
- **Hi-Lo** — card higher/lower prediction

### Social Features
- **Friends**: add by publicId, accept/decline, friend list
- **Direct Messages**: peer-to-peer chat threads (DM only, not global)
- **Global Chat**: 200-char limit, 2.5s poll, admin moderation (ban + delete)
- **Public Profiles**: avatar with colored initial, bio, rank, coins
- **Avatar colors**: user-selectable from 8 preset colors

### Pages
Home, Wallet (transfer + history), Profile (edit bio/color/email), Leaderboard (podium top 3),
Chat, Settings, Notifications, Friends, DM, DM-Thread, Public-Profile, Transfer,
About, FAQ, News, VIP, Edit-Profile, Splash (login/register), All 9 game pages

### Admin Panel (`/admin`)
- Dashboard stats, user management, manual coin add/subtract
- Chat moderation: delete messages, ban chat by duration
- News posts (create/delete)
- Owner user designation (yrejepov1@gmail.com is the owner)

## Admin Access

- Admin password: `ADMIN_PASSWORD` env var (default fallback: `admin123`)
- Admin login: `POST /api/admin/login` with `{ password }`
- Owner email: `yrejepov1@gmail.com`

## Brand

- **No phone or IMO contact info** anywhere in the UI (removed per user requirement)
- Contact via in-app DM to admin/owner only
- Language: Türkmen (all UI copy localized)

## API Port Note

The API server uses port **3001** (changed from 8080 to fix Replit workflow port detection).
The proxy routes `/api` → port 3001. The `.replit` file has a legacy `[[ports]] localPort = 8080` entry that is no longer used by the API server.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server (needs PORT injected by workflow)
- `pnpm --filter @workspace/coinhub run dev` — run CoinHub frontend

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
