import { createHash } from 'node:crypto';

import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';

import { levelsResponseSchema } from '../shared/level-contract';
import {
  FixtureLevelRepository,
  type LevelRepository,
} from './levels/repository';

type BuildAppOptions = {
  levelRepository?: LevelRepository;
  logger?: boolean;
  staticRoot?: string;
};

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });
  const levelRepository =
    options.levelRepository ?? new FixtureLevelRepository();

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.get('/api/v1/levels', async (request, reply) => {
    const response = levelsResponseSchema.parse({
      levels: await levelRepository.listPublished(),
    });
    const etag = createLevelsEtag(response.levels);

    reply
      .header('cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
      .header('etag', etag);

    if (request.headers['if-none-match'] === etag) {
      return reply.code(304).send();
    }

    return response;
  });

  if (options.staticRoot) {
    void app.register(fastifyStatic, {
      root: options.staticRoot,
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'API route not found' },
        });
      }

      return reply.sendFile('index.html');
    });
  }

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The server could not complete the request',
      },
    });
  });

  return app;
}

function createLevelsEtag(
  levels: ReadonlyArray<{ id: string; revision: number }>,
): string {
  const fingerprint = levels
    .map(({ id, revision }) => `${id}:${revision}`)
    .join('|');
  const digest = createHash('sha256').update(fingerprint).digest('base64url');
  return `"${digest}"`;
}
