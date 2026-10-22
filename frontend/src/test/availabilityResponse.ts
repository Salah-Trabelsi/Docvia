import { slot } from "./fixtures";

// Shared only by booking selection and rescheduling dialog tests.
export async function availabilityResponse(url: string) {
  if (url === "/doctors/test-doctor/calendar") {
    return {
      data: {
        month: "2030-01",
        timeZone: "Europe/Berlin",
        days: [
          { date: "2030-01-15", available: true },
          { date: "2030-01-16", available: false },
        ],
      },
    };
  }
  if (url === "/doctors/test-doctor/availability") {
    return {
      data: { date: "2030-01-15", timeZone: "Europe/Berlin", slots: [slot] },
    };
  }
  throw new Error("Unexpected test API request");
}
