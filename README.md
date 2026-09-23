# expand

Conway's Game of Life puzzle — visit every cell before you run out of clicks or live cells.

## Stack (Phase 0/1)

- **Web:** Vite + React + TypeScript (mobile-first)
- **API:** Fastify (`GET /api/v1/levels`)
- **Shared:** Zod level contracts + legacy starter fixtures
- **Game engine:** pure TypeScript (DOM-free), characterization-tested
- **Database:** Drizzle schema prepared under `db/` (PostgreSQL persistence lands in Phase 2)

## Development

Requirements: Node 20+.

```bash
npm install
npm run dev
```

- Game UI: http://localhost:5173
- API: http://localhost:8080

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite + Fastify with API proxy |
| `npm run build` | Build contracts, engine, web, and server |
| `npm start` | Run production server (serves `apps/web/dist`) |
| `npm test` | Vitest (contracts, engine, API service) |
| `npm run typecheck` | TypeScript across workspaces |

## Environment

| Variable | Purpose |
|---|---|
| `PORT` | API/static server port (default `8080`) |
| `NODE_ENV` | `production` enables static file serving |
| `DATABASE_URL` | Reserved for Phase 2 Drizzle migrations |

## Legacy note

The 2019 Webpack 4 + Express + Heroku keep-alive client has been removed. Level content is validated fixture data served by Fastify until PostgreSQL seeding is added.
