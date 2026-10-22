import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/axios", () => ({ api: http }));
import { BookingCalendar } from "./BookingCalendar";
import { doctorKeys } from "../queries/doctorKeys";
import { doctor, now } from "@/test/fixtures";
import { availabilityResponse } from "@/test/availabilityResponse";

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
  http.get.mockImplementation(availabilityResponse);
});
afterEach(() => vi.restoreAllMocks());

it("enables booking only after selecting a genuinely available date and time", async () => {
  const user = userEvent.setup();
  const { client } = renderWithProviders(<BookingCalendar doctor={doctor} />);
  const book = screen.getByRole("button", { name: "Book Appointment" });
  expect(book).toBeDisabled();
  const date = await screen.findByRole("button", {
    name: /January 15th, 2030/,
  });
  await waitFor(() => expect(date).toBeEnabled());
  const unavailable = screen.getByRole("button", {
    name: /January 16th, 2030/,
  });
  expect(unavailable).toBeDisabled();
  await user.click(unavailable);
  expect(book).toBeDisabled();
  await user.click(date);
  const time = await screen.findByRole("button", { name: "10:00" });
  expect(book).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "10:30" }),
  ).not.toBeInTheDocument();
  await user.click(time);
  expect(book).toBeEnabled();
  // A refreshed API response withdraws the selected slot: the real hook rejects it.
  http.get.mockResolvedValueOnce({
    data: {
      date: "2030-01-15",
      timeZone: "Europe/Berlin",
      slots: [],
    },
  });
  await act(async () => {
    await client.refetchQueries({
      queryKey: doctorKeys.slots("test-doctor", "2030-01-15"),
      exact: true,
    });
  });
  await waitFor(() => expect(book).toBeDisabled());
  expect(http.post).not.toHaveBeenCalled();
});
