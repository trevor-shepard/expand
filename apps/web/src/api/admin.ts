import {
  adminLevelResponseSchema,
  adminLevelsResponseSchema,
  adminSessionResponseSchema,
  type AdminLevel,
  type LevelInput,
} from "@expand/contracts";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Admin request failed (${response.status})`;
    try {
      const body = await response.json() as {
        error?: { message?: string };
      };
      message = body.error?.message ?? message;
    } catch {
      // Keep the status-based fallback for non-JSON responses.
    }
    throw new AdminApiError(message, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function login(password: string): Promise<void> {
  adminSessionResponseSchema.parse(
    await request("/api/v1/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  );
}

export async function checkSession(): Promise<void> {
  adminSessionResponseSchema.parse(
    await request("/api/v1/admin/auth/session"),
  );
}

export async function logout(): Promise<void> {
  await request("/api/v1/admin/auth/logout", { method: "POST" });
}

export async function listAdminLevels(): Promise<AdminLevel[]> {
  return adminLevelsResponseSchema.parse(
    await request("/api/v1/admin/levels"),
  ).levels;
}

export async function getAdminLevel(id: string): Promise<AdminLevel> {
  return adminLevelResponseSchema.parse(
    await request(`/api/v1/admin/levels/${id}`),
  ).level;
}

export async function createAdminLevel(input: LevelInput): Promise<AdminLevel> {
  return adminLevelResponseSchema.parse(
    await request("/api/v1/admin/levels", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  ).level;
}

export async function updateAdminLevel(
  id: string,
  input: LevelInput,
): Promise<AdminLevel> {
  return adminLevelResponseSchema.parse(
    await request(`/api/v1/admin/levels/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  ).level;
}

export async function runLevelAction(
  id: string,
  action: "publish" | "unpublish" | "archive",
): Promise<AdminLevel> {
  return adminLevelResponseSchema.parse(
    await request(`/api/v1/admin/levels/${id}/${action}`, {
      method: "POST",
    }),
  ).level;
}

export async function reorderAdminLevels(
  levelIds: string[],
): Promise<AdminLevel[]> {
  return adminLevelsResponseSchema.parse(
    await request("/api/v1/admin/levels/reorder", {
      method: "PATCH",
      body: JSON.stringify({ levelIds }),
    }),
  ).levels;
}
