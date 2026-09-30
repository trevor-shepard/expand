import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminLevel } from "@expand/contracts";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminApiError,
  checkSession,
  listAdminLevels,
  runLevelAction,
} from "../../api/admin";
import { AdminApp } from "./AdminApp";

vi.mock("../../api/admin", async () => {
  const actual = await vi.importActual<typeof import("../../api/admin")>(
    "../../api/admin",
  );
  return {
    ...actual,
    checkSession: vi.fn(),
    listAdminLevels: vi.fn(),
    runLevelAction: vi.fn(),
  };
});

const draftLevel: AdminLevel = {
  id: "00000000-0000-4000-8000-000000000088",
  slug: "draft-level",
  title: "Draft level",
  description: null,
  width: 4,
  height: 4,
  clickLimit: 4,
  initialLiveCells: [{ x: 1, y: 1 }],
  status: "draft",
  position: null,
  revision: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  publishedAt: null,
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("admin session gate", () => {
  it("shows a retryable error instead of treating API failures as logout", async () => {
    vi.mocked(checkSession).mockRejectedValue(
      new AdminApiError("Service unavailable", 503),
    );

    render(
      <MemoryRouter initialEntries={["/admin/levels"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </MemoryRouter>,
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Unable to open the level studio");
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Welcome back" }),
    ).toBeNull();
  });

  it("returns to login when the session expires during an action", async () => {
    const user = userEvent.setup();
    vi.mocked(checkSession).mockResolvedValue();
    vi.mocked(listAdminLevels).mockResolvedValue([draftLevel]);
    vi.mocked(runLevelAction).mockRejectedValue(
      new AdminApiError("Admin authentication required", 401),
    );

    render(
      <MemoryRouter initialEntries={["/admin/levels"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Publish" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeTruthy();
  });
});
