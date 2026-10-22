import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/axios", () => ({ api: http }));
import { LoginPage } from "../pages/AuthPages";

it("validates invalid login fields without calling the login API", async () => {
  const user = userEvent.setup();
  const { auth } = renderWithProviders(<LoginPage />, "/login");
  await user.type(
    screen.getByLabelText("Email", { exact: true }),
    "not-an-email",
  );
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(
    await screen.findByText("Enter a valid email address."),
  ).toBeInTheDocument();
  expect(screen.getByText("Password is required.")).toBeInTheDocument();
  expect(auth.login).not.toHaveBeenCalled();
  expect(http.post).not.toHaveBeenCalled();
});
