# expand

A mobile-first Conway's Game of Life puzzle. Reach every square before life
ends or the click budget runs out.

## Modernization foundation

The current Phase 0/1 slice uses:

- Vite, React, and TypeScript for the public game.
- A pure, DOM-independent Conway engine with characterization tests.
- Fastify for the same-origin HTTP server and `GET /api/v1/levels`.
- Shared Zod contracts for fixture, API, and client validation.
- A validated copy of the six legacy levels as the temporary API source.
- A Drizzle PostgreSQL schema ready for a later persistence migration.

Database connections, migrations, authentication, and the admin editor are
deliberately deferred. The fixture repository implements the boundary that a
future Drizzle repository will replace.

## Local development

Node 22 or newer is required.

```bash
npm install
npm run dev
```

Vite runs at `http://localhost:5173` and proxies `/api` to Fastify at
`http://localhost:3001`.

## Quality gates

```bash
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the built SPA and API from one Fastify process.

## Source layout

```text
src/
  client/             React game and mobile-first styles
  domain/game/        Pure Conway and player-action state transitions
  server/             Fastify app and fixture repository
  shared/             Zod contracts and validated legacy levels
  db/schema.ts        Drizzle-ready PostgreSQL model (not connected yet)
```

## Preserved gameplay rules

- Initial and generated live cells count as visited.
- Unvisited cells ignore player input.
- Waking a visited dead cell spends one click immediately.
- Forcing a visited live cell through the next generation is free.
- Winning means every square has been visited.
- A win takes precedence when win and loss happen in the same generation.