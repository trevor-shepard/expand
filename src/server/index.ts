import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildApp } from './app';

const port = Number.parseInt(process.env.PORT ?? '3001', 10);
const staticRoot = resolve(process.cwd(), 'dist');
const app = buildApp({
  logger: true,
  staticRoot: existsSync(staticRoot) ? staticRoot : undefined,
});

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

app
  .listen({ host: '0.0.0.0', port })
  .catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });
