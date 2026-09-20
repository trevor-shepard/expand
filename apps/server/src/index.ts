import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { levelsListResponseSchema } from "@expand/contracts";
import { levelsEtag, listPublishedLevels } from "./levels-service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? "0.0.0.0";
const webDist = path.resolve(__dirname, "../../web/dist");

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
});

app.get("/health", async () => ({ status: "ok" }));

app.get("/api/v1/levels", async (request, reply) => {
  const body = listPublishedLevels();
  const etag = levelsEtag(body);
  const ifNoneMatch = request.headers["if-none-match"];

  reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  reply.header("ETag", etag);

  if (ifNoneMatch === etag) {
    return reply.code(304).send();
  }

  levelsListResponseSchema.parse(body);
  return body;
});

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  await app.register(fastifyStatic, {
    root: webDist,
    prefix: "/",
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/")) {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found" } });
    }
    return reply.sendFile("index.html");
  });
}

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
