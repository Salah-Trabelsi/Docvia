import type { ReactNode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext } from "@/features/auth/useAuth";
import { patient } from "./fixtures";

const disposers: (() => void)[] = [];

afterEach(() => {
  cleanup();
  for (const dispose of disposers.splice(0)) dispose();
});

export function renderWithProviders(element: ReactNode, path = "/") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter([{ path: "*", element }], {
    initialEntries: [path],
  });
  const auth = {
    user: patient,
    isLoading: false,
    isError: false,
    isLoggingOut: false,
    refresh: vi.fn(),
    login: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
  };
  disposers.push(() => {
    router.dispose();
    client.clear();
  });
  const view = render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { ...view, client, router, auth };
}
