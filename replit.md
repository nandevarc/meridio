# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Alpha Track (`/`)
- **Kind**: react-vite web app
- **Path**: `artifacts/alpha-track/`
- **Preview**: `/`
- **Description**: Crypto/Web3 alpha project tracker
- **Storage**: localStorage (`alphatrack_v2` key)
- **Fonts**: Syne (titles) + IBM Plex Mono (body)
- **Pages**:
  - `/` — Dashboard with project cards, filters, search, status pills
  - `/add` — Add project (Quick Add & Full Form modes)
  - `/project/[id]` — Project detail with share text generation
  - `/project/[id]/edit` — Edit project
- **Key features**:
  - Quick status cycling (tap status badge)
  - Verdict system: Strong Play / Watch / Ignore with colored badges
  - Timing Window: Now (pulse animation) / This Week / Monitor / No Rush
  - Score breakdown: 5-component tap buttons (Narrative Fit, Team/Builder, CT Signal, Timing, Execution Risk), auto-computed total /25
  - Play status accents (green/amber left border on active cards)
  - Auto-highlight card rules: Rule 5 (Ignore/Skip dimming) > Rule 3 (Active+High pulse) > Rule 2 (StrongPlay border) > Rule 1 (highScore bg) + Rule 4 (TimingNow border additive)
  - Action required row always visible on collapsed cards
  - Dashboard verdict portfolio pills in header (strong/watch/ignore counts)
  - Timing Window filter dropdown (5th filter)
  - Kill Signal (Reason to Drop) conditional field — appears when verdict=Ignore or status=Skip
  - Bias Check field in full form (Analysis section)
  - CT Count number field with hint in score input
  - Quick Verdict selector on detail page
  - Backup/Restore JSON, Toast notifications, Collapsible sections
  - Migration runs on every load to backfill new fields on existing data
- **localStorage key**: `alphatrack_v2`
- **New types**: `Verdict`, `TimingWindow` 
- **New components**: `ScoreInput`, `ScoreDisplay`, `VerdictPicker`, `TimingPicker`

### API Server (`/api`)
- **Kind**: Express API server
- **Path**: `artifacts/api-server/`
- **Currently**: Basic health check only
