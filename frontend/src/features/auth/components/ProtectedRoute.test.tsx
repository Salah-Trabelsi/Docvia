import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AxiosError, AxiosHeaders } from "axios";
import type { AuthUser } from "@/api/auth";
import { AuthProvider } from "./AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/axios", () => ({ api: { get } }));

const patient: AuthUser = {
  _id: "synthetic-patient",
  firstName: "Test",
  lastName: "Patient",
  email: "patient@example.test",
  role: "patient",
};

let client: QueryClient;
let router: ReturnType<typeof createMemoryRouter>;

beforeEach(() => {
  get.mockReset();
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
});

afterEach(() => {
  cleanup();
  router.dispose();
  client.clear();
});

function renderProtectedPage() {
  router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute />,
        children: [{ path: "/profile", element: <h1>Private profile</h1> }],
      },
      { path: "/login", element: <h1>Sign in</h1> },
    ],
    { initialEntries: ["/profile?section=personal#details"] },
  );
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

it("waits for the session without redirecting, then renders the authenticated page", async () => {
  let resolveSession!: (value: { data: AuthUser }) => void;
  get.mockReturnValueOnce(
    new Promise<{ data: AuthUser }>((resolve) => {
      resolveSession = resolve;
    }),
  );
  renderProtectedPage();

  expect(screen.getByRole("status").textContent).toBe(
    "Checking your session...",
  );
  expect(router.state.location.pathname).toBe("/profile");
  expect(screen.queryByRole("heading")).toBeNull();

  await act(async () => resolveSession({ data: patient }));

  expect(
    await screen.findByRole("heading", { name: "Private profile" }),
  ).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expect(router.state.location.pathname).toBe("/profile");
  expect(get).toHaveBeenCalledWith("/auth/me", {
    withCredentials: true,
    signal: expect.any(AbortSignal),
  });
});

it("redirects an unauthenticated session to Login and preserves the requested destination", async () => {
  get.mockRejectedValueOnce(
    new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 401,
      statusText: "Unauthorized",
      data: { message: "Authentication required." },
      headers: {},
      config: { headers: new AxiosHeaders() },
    }),
  );
  renderProtectedPage();

  expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
  expect(router.state.location.pathname).toBe("/login");
  expect(router.state.location.state).toEqual({
    from: "/profile?section=personal#details",
  });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByText("Private profile")).toBeNull();
});

it("shows a recoverable timeout error instead of redirecting and retries on request", async () => {
  get.mockRejectedValueOnce(new AxiosError("Timeout", "ECONNABORTED"));
  const user = userEvent.setup();
  renderProtectedPage();

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Unable to check your session. Please try again.",
  );
  expect(router.state.location.pathname).toBe("/profile");
  expect(screen.queryByRole("heading")).toBeNull();
  expect(get).toHaveBeenCalledTimes(1);

  get.mockResolvedValueOnce({ data: patient });
  await user.click(screen.getByRole("button", { name: "Try again" }));

  expect(
    await screen.findByRole("heading", { name: "Private profile" }),
  ).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(get).toHaveBeenCalledTimes(2);
});
