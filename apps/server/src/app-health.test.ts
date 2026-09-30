import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import { FixtureLevelRepository } from "./repositories/fixture-level-repository.js";

const auth = {
  password: "test-admin-password",
  sessionSecret: "test-session-secret-at-least-32-characters",
  sessionTtlSeconds: 3_600,
  secureCookie: false,
};

class UnhealthyRepository extends FixtureLevelRepository {
  async checkHealth(): Promise<void> {
    throw new Error("database unavailable");
  }
}

describe("health endpoint", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("reports repository readiness failures", async () => {
    app = await buildApp({
      repository: new UnhealthyRepository(),
      auth,
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe("SERVICE_UNAVAILABLE");
  });
});
