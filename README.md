# expand

Conway's Game of Life puzzle — visit every cell before you run out of clicks or live cells.

## Stack

- **Web:** Vite + React + TypeScript (mobile-first)
- **Admin:** React routes under `/admin` with level lifecycle, grid editor, and playtest preview
- **API:** Fastify public and signed-session admin APIs
- **Shared:** Zod public/admin contracts + legacy starter fixtures
- **Game engine:** pure TypeScript (DOM-free), characterization-tested
- **Database:** PostgreSQL through Drizzle, with migrations and an explicit fixture fallback

## Development

Requirements: Node 20+.

```bash
npm install
export ADMIN_PASSWORD="<a local password of at least 12 characters>"
export ADMIN_SESSION_SECRET="$(openssl rand -base64 48)"
npm run dev
```

- Game UI: http://localhost:5173
- Admin login: http://localhost:5173/admin/login
- API: http://localhost:8080
- Vite proxies `/api` to Fastify, so admin cookies remain same-origin.
- With no `DATABASE_URL`, development and tests use an in-memory fixture repository.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite + Fastify with API proxy |
| `npm run build` | Build contracts, engine, web, and server |
| `npm start` | Run production server (serves `apps/web/dist`) |
| `npm test` | Vitest (contracts, engine, API, and editor) |
| `npm run typecheck` | TypeScript across workspaces |
| `npm run lint` | ESLint across workspaces |
| `npm run db:generate` | Generate a migration after schema changes |
| `npm run db:migrate` | Apply committed migrations to `DATABASE_URL` |
| `npm run db:seed` | Seed starter levels into an empty migrated database |

## Environment

| Variable | Purpose |
|---|---|
| `PORT` | API/static server port (default `8080`) |
| `HOST` | API bind address (default `0.0.0.0`) |
| `NODE_ENV` | `production` enables static file serving |
| `DATABASE_URL` | PostgreSQL connection URL; required in production |
| `LEVEL_REPOSITORY` | `postgres` or `fixture`; inferred from `DATABASE_URL` outside production |
| `DATABASE_POOL_SIZE` | PostgreSQL pool size (default `10`) |
| `ADMIN_PASSWORD` | Admin password, required and at least 12 characters |
| `ADMIN_SESSION_SECRET` | Cookie signing secret, required and at least 32 characters |
| `ADMIN_SESSION_TTL_SECONDS` | Session lifetime, 300–86400 seconds (default `28800`) |
| `ADMIN_COOKIE_SECURE` | Optional `true`/`false` override; defaults to `true` in production |
| `VITE_STATIC_LEVELS` | Public-game-only fixture mode for static builds; never use for secrets |

Only variables prefixed with `VITE_` are exposed to browser bundles. Admin credentials and
session secrets must remain server-only and must not use that prefix.

## PostgreSQL setup

Create a database, then run:

```bash
export DATABASE_URL="postgresql://..."
npm run db:migrate
npm run db:seed
```

The seed is intentionally safe for existing content: it inserts the six starter levels only
when the `levels` table is empty, and otherwise exits without modifying rows. Production
startup requires PostgreSQL and fails rather than silently serving fixture content.

## Admin security and lifecycle

Admin routes use an expiring, signed, HttpOnly, SameSite=Strict cookie. Mutation requests
with a foreign `Origin` are rejected, and password attempts are rate limited. Levels are created as drafts; only published levels
appear in `GET /api/v1/levels`. Unpublishing removes a level from public play without deleting
it, while archive is the soft-delete operation. Reordering applies to the complete published
set in one repository transaction.

## Legacy behavior

The 2019 Webpack 4 + Express + Heroku keep-alive client has been removed. The original six
levels and game-engine behavior remain covered by characterization tests and are also the
initial PostgreSQL seed.
