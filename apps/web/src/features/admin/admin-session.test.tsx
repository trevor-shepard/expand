import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminApiError, checkSession } from "../../api/admin";
import { AdminApp } from "./AdminApp";

vi.mock("../../api/admin", async () => {
  const actual = await vi.importActual<typeof import("../../api/admin")>(
    "../../api/admin",
  );
  return {
    ...actual,
    checkSession: vi.fn(),
  };
});

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
});
