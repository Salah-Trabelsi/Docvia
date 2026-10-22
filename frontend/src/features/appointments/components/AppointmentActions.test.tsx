import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/axios", () => ({ api: http }));
import { AppointmentListCard } from "./AppointmentListCard";
import { appointment, now } from "@/test/fixtures";
import { availabilityResponse } from "@/test/availabilityResponse";

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
  http.get.mockImplementation(availabilityResponse);
});
afterEach(() => vi.restoreAllMocks());

it("opens the real reschedule and cancellation dialogs for the selected appointment", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <AppointmentListCard appointment={appointment} now={now} />,
  );
  await user.click(screen.getByRole("button", { name: "Reschedule" }));
  let dialog = await screen.findByRole("dialog");
  expect(
    within(dialog).getByRole("heading", { name: "Reschedule appointment" }),
  ).toBeInTheDocument();
  expect(within(dialog).getByText(/Dr\. Robin Example/)).toBeInTheDocument();
  expect(within(dialog).getByText(/10:00 - 10:30/)).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  dialog = await screen.findByRole("dialog");
  expect(
    within(dialog).getByRole("heading", { name: "Cancel this appointment?" }),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText(/Dr\. Robin Example.*15 Jan 2030/),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", {
      name: "Cancel appointment",
    }),
  ).toBeEnabled();
  expect(http.patch).not.toHaveBeenCalled();
});
