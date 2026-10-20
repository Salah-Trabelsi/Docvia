import { DayPicker, TZDate } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { bookingTimeZone as timeZone } from "../utils/availability";
import type { useDoctorSlotSelection } from "../hooks/useDoctorSlotSelection";

export function DoctorSlotPicker({
  selection,
}: {
  selection: ReturnType<typeof useDoctorSlotSelection>;
}) {
  const {
    date,
    setDate,
    time,
    setTime,
    today,
    month,
    setMonth,
    lastDate,
    calendar,
    availability,
    dateUnavailable,
    doctorTimeSlots,
    validSelection,
  } = selection;
  return (
    <div className="mt-5 grid min-w-0 gap-6 @min-[42rem]:grid-cols-2">
      <div className="min-w-0" aria-busy={calendar.isFetching}>
        <DayPicker
          mode="single"
          timeZone={timeZone}
          today={today}
          month={month}
          onMonthChange={(value) => {
            setMonth(new TZDate(value, timeZone));
            setDate(undefined);
            setTime(undefined);
          }}
          selected={date}
          onSelect={(value) => {
            setDate(value);
            setTime(undefined);
          }}
          disabled={dateUnavailable}
          startMonth={today}
          endMonth={lastDate}
          weekStartsOn={1}
          navLayout="around"
          classNames={{
            root: "min-w-0",
            months: "relative",
            month: "w-full",
            month_caption: "flex h-11 items-center justify-center px-11",
            caption_label: "text-sm font-semibold",
            button_previous:
              "absolute left-0 top-0 flex size-11 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30",
            button_next:
              "absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30",
            chevron: "size-4 fill-current",
            month_grid: "mt-3 w-full table-fixed border-collapse",
            weekday:
              "pb-2 text-center text-xs font-normal text-muted-foreground",
            day: "p-0.5 text-center",
            day_button:
              "flex min-h-10 w-full items-center justify-center rounded-lg text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed",
            selected:
              "[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground",
            disabled:
              "text-muted-foreground/40 [&>button]:hover:bg-transparent",
            today: "[&>button]:ring-1 [&>button]:ring-primary",
          }}
        />
        {calendar.isPending && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            Loading available dates...
          </p>
        )}
        {calendar.isError && (
          <div role="alert" className="mt-3 text-sm text-destructive">
            Unable to load available dates.{" "}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void calendar.refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        {calendar.isSuccess &&
          !calendar.data.days.some(
            (day) => day.available && day.date >= format(today, "yyyy-MM-dd"),
          ) && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              No available dates this month.
            </p>
          )}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">Available times</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {date
            ? format(new TZDate(date, timeZone), "EEEE, d MMMM yyyy")
            : "Choose a date to see available times."}
        </p>
        {date && availability.isPending && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Loading available times...
          </p>
        )}
        {date && availability.isError && (
          <div role="alert" className="mt-4 text-sm text-destructive">
            Unable to load available times.{" "}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void availability.refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        {date && availability.isSuccess && !doctorTimeSlots.length && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            No future appointment times are available on this date.
          </p>
        )}
        {date && doctorTimeSlots.length > 0 && (
          <div
            aria-label="Appointment time"
            className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {doctorTimeSlots.map((slot) => {
              const label = format(
                new TZDate(new Date(slot.startAt), timeZone),
                "HH:mm",
              );
              return (
                <Button
                  key={slot.startAt}
                  variant={time === slot.startAt ? "default" : "outline"}
                  className="min-h-11"
                  aria-pressed={time === slot.startAt}
                  onClick={() => setTime(slot.startAt)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        )}
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {validSelection && date && time
            ? `Selected: ${format(new TZDate(date, timeZone), "d MMM yyyy")} at ${format(new TZDate(new Date(time), timeZone), "HH:mm")} (Europe/Berlin).`
            : "Select an available date and time."}
        </p>
      </div>
    </div>
  );
}
