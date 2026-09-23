import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { FixtureLevelRepository } from "./repositories/fixture-level-repository.js";

const auth = {
  password: "test-admin-password",
  sessionSecret: "test-session-secret-at-least-32-characters",
  sessionTtlSeconds: 3_600,
  secureCookie: false,
};

const newLevel = {
  slug: "editor-test-level",
  title: "Editor test",
  description: "Created through the admin API",
  width: 4,
  height: 4,
  clickLimit: 6,
  initialLiveCells: [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
  ],
};

describe("admin API", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      repository: new FixtureLevelRepository(),
      auth,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  async function login(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/admin/auth/login",
      payload: { password: auth.password },
    });
    expect(response.statusCode).toBe(200);
    const setCookie = response.headers["set-cookie"];
    expect(setCookie).toBeTypeOf("string");
    return (setCookie as string).split(";")[0];
  }

  it("rejects unauthenticated admin reads and mutations", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/admin/levels",
    });
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/admin/levels",
      payload: newLevel,
    });

    expect(list.statusCode).toBe(401);
    expect(create.statusCode).toBe(401);
    expect(list.json().error.code).toBe("UNAUTHENTICATED");
  });

  it("sets a signed HttpOnly same-origin session cookie on login", async () => {
    const rejected = await app.inject({
      method: "POST",
      url: "/api/v1/admin/auth/login",
      payload: { password: "incorrect-password" },
    });
    expect(rejected.statusCode).toBe(401);
    expect(rejected.headers["set-cookie"]).toBeUndefined();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/admin/auth/login",
      payload: { password: auth.password },
    });
    const setCookie = response.headers["set-cookie"] as string;

    expect(response.statusCode).toBe(200);
    expect(setCookie).toContain("expand_admin_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");

    const cookie = setCookie.split(";")[0];
    const authenticated = await app.inject({
      method: "GET",
      url: "/api/v1/admin/auth/session",
      headers: { cookie },
    });
    expect(authenticated.statusCode).toBe(200);

    const tampered = await app.inject({
      method: "GET",
      url: "/api/v1/admin/auth/session",
      headers: { cookie: `${cookie}tampered` },
    });
    expect(tampered.statusCode).toBe(401);
  });

  it("rate limits repeated failed login attempts", async () => {
    const responses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await app.inject({
          method: "POST",
          url: "/api/v1/admin/auth/login",
          payload: { password: "incorrect-password" },
        }),
      );
    }

    expect(responses.slice(0, 5).every((response) => response.statusCode === 401))
      .toBe(true);
    expect(responses[5].statusCode).toBe(429);
  });

  it("rejects cross-origin login and logout requests", async () => {
    const crossOriginLogin = await app.inject({
      method: "POST",
      url: "/api/v1/admin/auth/login",
      headers: {
        host: "expand.example",
        origin: "https://attacker.example",
      },
      payload: { password: auth.password },
    });
    expect(crossOriginLogin.statusCode).toBe(403);
    expect(crossOriginLogin.headers["set-cookie"]).toBeUndefined();

    const cookie = await login();
    const crossOriginLogout = await app.inject({
      method: "POST",
      url: "/api/v1/admin/auth/logout",
      headers: {
        cookie,
        host: "expand.example",
        origin: "https://attacker.example",
      },
    });
    expect(crossOriginLogout.statusCode).toBe(403);
  });

  it("creates, updates, publishes, unpublishes, and archives a level", async () => {
    const cookie = await login();
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/admin/levels",
      headers: { cookie },
      payload: newLevel,
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().level.status).toBe("draft");
    const id = created.json().level.id as string;

    const beforePublish = await app.inject({
      method: "GET",
      url: "/api/v1/levels",
    });
    expect(
      beforePublish.json().levels.some((level: { id: string }) => level.id === id),
    ).toBe(false);

    const updated = await app.inject({
      method: "PUT",
      url: `/api/v1/admin/levels/${id}`,
      headers: { cookie },
      payload: { ...newLevel, title: "Updated editor test" },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().level.title).toBe("Updated editor test");
    expect(updated.json().level.revision).toBe(2);

    const published = await app.inject({
      method: "POST",
      url: `/api/v1/admin/levels/${id}/publish`,
      headers: { cookie },
    });
    expect(published.statusCode).toBe(200);
    expect(published.json().level.status).toBe("published");

    const afterPublish = await app.inject({
      method: "GET",
      url: "/api/v1/levels",
    });
    expect(
      afterPublish.json().levels.some((level: { id: string }) => level.id === id),
    ).toBe(true);

    const unpublished = await app.inject({
      method: "POST",
      url: `/api/v1/admin/levels/${id}/unpublish`,
      headers: { cookie },
    });
    expect(unpublished.json().level.status).toBe("draft");

    const afterUnpublish = await app.inject({
      method: "GET",
      url: "/api/v1/levels",
    });
    expect(
      afterUnpublish.json().levels.some((level: { id: string }) => level.id === id),
    ).toBe(false);

    const archived = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/levels/${id}`,
      headers: { cookie },
    });
    expect(archived.json().level.status).toBe("archived");
  });

  it("reorders every published level and changes public ordering", async () => {
    const cookie = await login();
    const initial = await app.inject({
      method: "GET",
      url: "/api/v1/levels",
    });
    const initialIds = initial.json().levels.map(
      (level: { id: string }) => level.id,
    ) as string[];
    const reversedIds = [...initialIds].reverse();

    const reordered = await app.inject({
      method: "PATCH",
      url: "/api/v1/admin/levels/reorder",
      headers: { cookie },
      payload: { levelIds: reversedIds },
    });
    expect(reordered.statusCode).toBe(200);

    const publicResponse = await app.inject({
      method: "GET",
      url: "/api/v1/levels",
    });
    expect(
      publicResponse.json().levels.map((level: { id: string }) => level.id),
    ).toEqual(reversedIds);
  });

  it("rejects cross-origin admin mutations", async () => {
    const cookie = await login();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/admin/levels",
      headers: {
        cookie,
        host: "expand.example",
        origin: "https://attacker.example",
      },
      payload: newLevel,
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("INVALID_ORIGIN");
  });
});
