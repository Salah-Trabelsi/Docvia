import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { MobileNavigation } from "./MobileNavigation";
import { renderWithProviders } from "@/test/renderWithProviders";

it("renders the five mobile links and preserves active routes and enabled Assistant navigation", async () => {
  const user = userEvent.setup();
  const { router } = renderWithProviders(<MobileNavigation />);
  // jsdom does not apply Tailwind breakpoints: scope to the first, mobile nav.
  const nav = within(
    screen.getAllByRole("navigation", { name: "Patient navigation" })[0],
  );
  expect(nav.getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Overview",
    "My Appointments",
    "My Profile",
    "Settings",
    "AI Assistant",
  ]);
  expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await user.click(nav.getByRole("link", { name: "My Appointments" }));
  expect(router.state.location.pathname).toBe("/appointments");
  expect(nav.getByRole("link", { name: "My Appointments" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(nav.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
    "aria-current",
  );
  // Current production behavior is enabled; there is no disabled Assistant flag.
  const assistant = nav.getByRole("link", { name: "AI Assistant" });
  expect(assistant).not.toHaveAttribute("aria-disabled", "true");
  await user.click(assistant);
  expect(router.state.location.pathname).toBe("/assistant");
});
