import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

afterEach(cleanup);

describe("App routing", () => {
  it("renders the nested admin login route", () => {
    render(
      <MemoryRouter initialEntries={["/admin/login"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeTruthy();
  });
});
