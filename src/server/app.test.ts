import { afterEach, describe, expect, it } from 'vitest';

import { legacyLevels } from '../shared/legacy-levels';
import { levelsResponseSchema } from '../shared/level-contract';
import { buildApp } from './app';

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('Fastify levels API', () => {
  it('serves all validated fixture levels in progression order', async () => {
    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/levels',
    });
    const payload = levelsResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(payload.levels).toEqual(legacyLevels);
    expect(response.headers['cache-control']).toContain('s-maxage=60');
    expect(response.headers.etag).toMatch(/^".+"$/);
  });

  it('returns 304 when the fixture revision ETag still matches', async () => {
    const app = buildApp();
    apps.push(app);

    const initial = await app.inject('/api/v1/levels');
    const cached = await app.inject({
      method: 'GET',
      url: '/api/v1/levels',
      headers: { 'if-none-match': initial.headers.etag },
    });

    expect(cached.statusCode).toBe(304);
    expect(cached.body).toBe('');
  });

  it('exposes a process health endpoint', async () => {
    const app = buildApp();
    apps.push(app);

    const response = await app.inject('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
