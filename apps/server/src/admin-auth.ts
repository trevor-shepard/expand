import { createHash, timingSafeEqual } from "node:crypto";
import fastifyCookie from "@fastify/cookie";
import fastifyRateLimit from "@fastify/rate-limit";
import {
  adminLoginSchema,
  adminSessionResponseSchema,
} from "@expand/contracts";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { z } from "zod";

const SESSION_COOKIE_NAME = "expand_admin_session";

const authEnvironmentSchema = z.object({
  ADMIN_PASSWORD: z.string().min(12),
  ADMIN_SESSION_SECRET: z.string().min(32),
  ADMIN_SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(86_400)
    .default(28_800),
  ADMIN_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
}).passthrough();

export interface AdminAuthConfig {
  password: string;
  sessionSecret: string;
  sessionTtlSeconds: number;
  secureCookie: boolean;
}

interface SessionPayload {
  version: 1;
  expiresAt: number;
}

export function loadAdminAuthConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AdminAuthConfig {
  const env = authEnvironmentSchema.parse(environment);
  return {
    password: env.ADMIN_PASSWORD,
    sessionSecret: env.ADMIN_SESSION_SECRET,
    sessionTtlSeconds: env.ADMIN_SESSION_TTL_SECONDS,
    secureCookie:
      env.ADMIN_COOKIE_SECURE === undefined
        ? env.NODE_ENV === "production"
        : env.ADMIN_COOKIE_SECURE === "true",
  };
}

function passwordMatches(candidate: string, expected: string): boolean {
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeSession(value: string): SessionPayload | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== 1 ||
      !("expiresAt" in parsed) ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return { version: 1, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export class AdminAuth {
  constructor(private readonly config: AdminAuthConfig) {}

  async register(app: FastifyInstance): Promise<void> {
    await app.register(fastifyCookie, {
      secret: this.config.sessionSecret,
      hook: "onRequest",
    });
    await app.register(fastifyRateLimit, {
      global: false,
    });

    app.post("/api/v1/admin/auth/login", {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    }, async (request, reply) => {
      const { password } = adminLoginSchema.parse(request.body);
      if (!passwordMatches(password, this.config.password)) {
        return reply.code(401).send({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        });
      }

      const expiresAt =
        Math.floor(Date.now() / 1_000) + this.config.sessionTtlSeconds;
      reply
        .header("Cache-Control", "no-store")
        .setCookie(
          SESSION_COOKIE_NAME,
          encodeSession({ version: 1, expiresAt }),
          {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: this.config.secureCookie,
            signed: true,
            maxAge: this.config.sessionTtlSeconds,
          },
        );
      return adminSessionResponseSchema.parse({ authenticated: true });
    });

    app.get("/api/v1/admin/auth/session", {
      preHandler: this.requireAdmin,
    }, async (_request, reply) => {
      reply.header("Cache-Control", "no-store");
      return adminSessionResponseSchema.parse({ authenticated: true });
    });

    app.post("/api/v1/admin/auth/logout", async (_request, reply) => {
      reply
        .header("Cache-Control", "no-store")
        .clearCookie(SESSION_COOKIE_NAME, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: this.config.secureCookie,
        });
      return reply.code(204).send();
    });
  }

  readonly requireAdmin = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!this.hasValidSession(request)) {
      await reply.code(401).send({
        error: {
          code: "UNAUTHENTICATED",
          message: "Admin authentication required",
        },
      });
      return;
    }
    reply.header("Cache-Control", "no-store");
  };

  readonly requireSameOrigin = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const origin = request.headers.origin;
    const host = request.headers.host;
    if (!origin || !host) return;

    try {
      if (new URL(origin).host === host) return;
    } catch {
      // Invalid origins are rejected below.
    }

    await reply.code(403).send({
      error: {
        code: "INVALID_ORIGIN",
        message: "Cross-origin admin mutations are not allowed",
      },
    });
  };

  private hasValidSession(request: FastifyRequest): boolean {
    const signedValue = request.cookies[SESSION_COOKIE_NAME];
    if (!signedValue) return false;
    const unsigned = request.unsignCookie(signedValue);
    if (!unsigned.valid || !unsigned.value) return false;
    const session = decodeSession(unsigned.value);
    return session !== null && session.expiresAt > Math.floor(Date.now() / 1_000);
  }
}
