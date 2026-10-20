import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function AppointmentManagementCard() {
  return (
    <section
      aria-labelledby="appointment-management-heading"
      className="@container flex flex-col justify-center rounded-xl bg-accent p-5 text-accent-foreground lg:min-h-[190px]"
    >
      <div className="flex min-w-0 flex-col items-start gap-4 @min-[18rem]:flex-row @min-[18rem]:items-center">
        <img
          src="/images/icons/calendar.png"
          alt=""
          className="size-20 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <h2
            id="appointment-management-heading"
            className="text-lg font-semibold leading-snug"
          >
            Manage your appointments easily
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            View, reschedule or cancel your appointments anytime.
          </p>
          <Button
            nativeButton={false}
            render={<Link to="/appointments" />}
            className="mt-3 h-auto min-h-11 max-w-full whitespace-normal px-3 py-2 text-center"
          >
            Manage Appointments
          </Button>
        </div>
      </div>
    </section>
  );
}
