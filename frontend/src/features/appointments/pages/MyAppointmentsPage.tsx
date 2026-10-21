import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Tabs } from "@base-ui/react/tabs";
import { useAppointments } from "../hooks/useAppointments";
import { AppointmentLoadError } from "../components/AppointmentLoadError";
import { useAvailabilityClock } from "@/features/doctors/hooks/useAvailabilityClock";
import { AppointmentListCard } from "../components/AppointmentListCard";
import type { PatientAppointment } from "@/api/appointments";

const categories = ["Upcoming", "Completed", "Cancelled"] as const;
type Category = (typeof categories)[number];
const filters = ["All", ...categories] as const;
type AppointmentFilter = (typeof filters)[number];

export function MyAppointmentsPage() {
  const query = useAppointments();
  const appointments = query.data ?? [];
  const [category, setCategory] = useState<AppointmentFilter>("All");
  const [sort, setSort] = useState("earliest");
  const now = useAvailabilityClock();
  const groups: Record<Category | "Past Confirmed", PatientAppointment[]> = {
    Upcoming: appointments.filter(
      (item) => item.status === "confirmed" && Date.parse(item.startsAt) > now,
    ),
    "Past Confirmed": appointments.filter(
      (item) => item.status === "confirmed" && Date.parse(item.startsAt) <= now,
    ),
    Completed: appointments.filter((item) => item.status === "completed"),
    Cancelled: appointments.filter((item) => item.status === "cancelled"),
  };

  return (
    <div className="@container min-w-0 space-y-4">
      <section className="relative isolate overflow-hidden rounded-xl bg-accent/50 sm:flex sm:aspect-[2172/355] sm:items-center lg:aspect-auto lg:h-[185px]">
        <div className="relative z-10 px-4 pt-4 pb-[26%] sm:w-[55%] sm:px-7 sm:py-5 lg:px-9">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            My Appointments
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Manage your doctor consultations and keep track of your health
            journey
          </p>
        </div>
        {/* Keep the existing mobile/tablet framing. */}
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 171 2172 355"
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute right-0 bottom-0 -z-10 block aspect-[2172/355] w-[160%] max-w-none [mask-image:linear-gradient(to_bottom,transparent,black_8%)] sm:inset-0 sm:h-full sm:w-full sm:[mask-image:none] lg:hidden"
        >
          <image
            href="/images/banners/docvia-appointments-banner.png"
            width="2172"
            height="724"
          />
        </svg>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 171 2172 355"
          preserveAspectRatio="xMaxYMid meet"
          className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full lg:block"
        >
          <image
            href="/images/banners/docvia-appointments-banner.png"
            width="2172"
            height="724"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 35%)",
            }}
          />
        </svg>
      </section>
      <Tabs.Root
        value={category}
        onValueChange={(value) => {
          if (filters.includes(value as AppointmentFilter))
            setCategory(value as AppointmentFilter);
        }}
      >
        <Tabs.List
          aria-label="Appointment categories"
          className="flex flex-wrap gap-2"
        >
          {filters.map((item) => (
            <Tabs.Tab
              key={item}
              value={item}
              className="min-h-11 rounded-full bg-card px-5 py-2 text-sm text-muted-foreground data-active:bg-foreground data-active:text-background focus-visible:outline-2 focus-visible:outline-ring"
            >
              {item}
              {` (${item === "All" ? appointments.length : groups[item].length})`}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <div className="my-3 flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="min-h-11 max-w-full rounded-lg border border-input bg-card px-3 text-foreground"
            >
              <option value="earliest">Date (Earliest)</option>
              <option value="latest">Date (Latest)</option>
            </select>
          </label>
        </div>
        <Tabs.Panel key={category} value={category} className="space-y-5">
          {query.isPending ? (
            <p role="status" className="rounded-xl bg-card p-5">
              Loading appointments...
            </p>
          ) : query.isError ? (
            <AppointmentLoadError
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : (
            [
              ...categories,
              ...(groups["Past Confirmed"].length
                ? ["Past Confirmed" as const]
                : []),
            ]
              .filter((item) => category === "All" || item === category)
              .map((item) => (
                <section
                  key={item}
                  aria-labelledby={`${item.toLowerCase().replaceAll(" ", "-")}-appointments-heading`}
                >
                  <h2
                    id={`${item.toLowerCase().replaceAll(" ", "-")}-appointments-heading`}
                    className="mb-3 text-lg font-semibold"
                  >
                    {item} Appointments
                  </h2>
                  {groups[item].length ? (
                    <div className="space-y-3">
                      {[...groups[item]]
                        .sort(
                          (a, b) =>
                            (Date.parse(a.startsAt) - Date.parse(b.startsAt)) *
                            (sort === "earliest" ? 1 : -1),
                        )
                        .map((appointment) => (
                          <AppointmentListCard
                            key={appointment._id}
                            appointment={appointment}
                            now={now}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-card px-5 py-12 text-center shadow-card">
                      <CalendarDays
                        aria-hidden="true"
                        className="mx-auto mb-3 size-8 text-muted-foreground"
                      />
                      <h3 className="font-medium">
                        No {item.toLowerCase()} appointments
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Your {item.toLowerCase()} consultations will appear
                        here.
                      </p>
                    </div>
                  )}
                </section>
              ))
          )}
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );
}
