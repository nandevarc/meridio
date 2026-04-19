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
  - Quick status cycling (tap status badge to cycle through statuses)
  - Play status visual accents (green/amber left border on active cards)
  - Backup/Restore JSON data
  - Toast notifications
  - Collapsible form sections
  - Multi-select play type tags

### API Server (`/api`)
- **Kind**: Express API server
- **Path**: `artifacts/api-server/`
- **Currently**: Basic health check only
