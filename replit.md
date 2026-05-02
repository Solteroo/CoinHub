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

### PRO UI Components (v2)
- **Hero Section** (home): animated floating orbs, gold grid pattern bg, shimmer jackpot pool counter, VIP badge, deposit/transfer CTA buttons
- **Live Activity Feed** (`LiveActivityFeed.tsx`): real-time simulated wins/losses ticker with AnimatePresence
- **VIP Level System** (`VipLevelBar.tsx` + `lib/vip-level.ts`): Bronze/Silver/Gold/VIP tiers from coin balance, XP progress bar
- **Games Grid**: 2-column PRO cards with gradient backgrounds, hover glow effects, PLAY buttons
- **Wallet**: glassmorphism hero, income/expense stats, animated tx list
- **TopHeader**: `+` deposit button (DMs owner), VIP badge in drawer

### CSS PRO Effects (`index.css`)
- `.shimmer-text` — animated gold shimmer for jackpot counter
- `.float-orb` / `.float-orb-2` / `.float-orb-3` — floating gradient blobs for hero bg
- `.neon-pulse` — pulsing gold glow on CTA buttons
- `.hero-grid` — subtle gold grid pattern overlay
- `.glass-card` — glassmorphism surface

### Pages
Home, Wallet (transfer + history), Profile (edit bio/color/emoji avatar), Leaderboard (podium top 3),
Chat, Settings, Notifications, Friends, DM, DM-Thread (Telegram-style), Public-Profile, Transfer,
About, FAQ, News, Edit-Profile, Splash (login/register), All 9 game pages
VIP page redirects to owner DM (no VIP tile on profile)

### PRO Casino Game Layouts (v3)
- **GameLayout.tsx** shared component: full screen, no navbar overlap, back button, balance header, game-specific glow colors
- All 9 games use GameLayout with immersive full-screen design and color themes:
  - Slot=Purple, Spin=Blue, LuckyBox=Amber, Crash=Red, Dice=Green, Mines=Orange, Roulette=Rose, Plinko=Cyan, HiLo=Yellow
- Sound: `playLose` alias exported from `sounds.ts` (alias for `playLoss`)

### PWA Install Prompt
- Shows 3s after load, skips if already in standalone mode or dismissed
- **iOS**: step-by-step Share→Add to Home Screen instructions (2 steps)
- **Android/Chrome**: native beforeinstallprompt banner with Install/No buttons
- STORAGE_KEY: `coinhub_pwa_dismissed_v2`

### i18n (4 languages)
- **ru** (default), **en**, **tm** (Turkmen), **uz** (Uzbek)
- All keys present in all 4 sections including: `roll_btn`, `picks`, `multiplier`, `hilo_result`

### Admin Panel (`/admin`)
- Dashboard stats (Russian labels), user management, manual coin add/subtract
- **DM Inbox tab**: view all incoming DM threads with unread counts
- Chat moderation: delete messages, ban chat by duration (Russian labels)
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
