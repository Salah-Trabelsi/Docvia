import { useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { TZDate } from "react-day-picker";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { bookingTimeZone } from "@/features/doctors/utils/availability";
import { AppointmentDetailsDialog } from "./AppointmentDetailsDialog";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";
import { RescheduleAppointmentDialog } from "./RescheduleAppointmentDialog";
import { AppointmentDoctorImage } from "./AppointmentDoctorImage";
import type { PatientAppointment } from "@/api/appointments";

interface Props {
  appointment: PatientAppointment;
  now: number;
}

export function AppointmentListCard({ appointment, now }: Props) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"details" | "cancel" | "reschedule">(
    "details",
  );
  const [busy, setBusy] = useState(false);
  const doctor = appointment.doctorId;
  const name = doctor
    ? `Dr. ${doctor.firstName} ${doctor.lastName}`
    : "Doctor unavailable";
  const start = new TZDate(appointment.startsAt, bookingTimeZone);
  const end = new TZDate(appointment.endsAt, bookingTimeZone);
  const upcoming = appointment.status === "confirmed" && start.getTime() > now;
  const days = differenceInCalendarDays(
    start,
    new TZDate(now, bookingTimeZone),
  );
  const badge = upcoming
    ? days === 0
      ? "Today"
      : `In ${days} ${days === 1 ? "day" : "days"}`
    : appointment.status === "confirmed"
      ? "Past - Confirmed"
      : appointment.status;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) setOpen(value);
      }}
    >
      <article className="relative grid min-w-0 gap-4 rounded-xl bg-card p-4 shadow-card @min-[56rem]:grid-cols-[5rem_minmax(0,1fr)_20rem]">
        <DialogTrigger
          onClick={() => setAction("details")}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={`View appointment details for ${name}, ${format(start, "d MMMM yyyy")}`}
        />
        <div className="flex w-fit min-w-20 flex-col items-center justify-center rounded-xl bg-accent/60 px-3 py-2 text-brand-foreground @min-[56rem]:w-full">
          <span className="text-3xl font-semibold">{format(start, "dd")}</span>
          <span className="text-xs">{format(start, "MMM yyyy")}</span>
          <span className="mt-0.5 text-xs">{format(start, "EEE")}</span>
        </div>
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <AppointmentDoctorImage src={doctor?.imageUrl} name={name} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {doctor?.specialty ?? "Specialty unavailable"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs capitalize ${upcoming ? "bg-sky-100 text-sky-700" : appointment.status === "completed" ? "bg-success-subtle text-success" : appointment.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                title={appointment.status}
              >
                {badge}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Building2 aria-hidden="true" className="size-4 shrink-0" />
                {doctor?.clinic?.name ?? "Practice unavailable"}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                {doctor?.clinic?.city ?? "Location unavailable"}
              </p>
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-background/70 p-3">
          <div className="flex items-center gap-3">
            <Clock3 aria-hidden="true" className="size-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {format(start, "HH:mm")} – {format(end, "HH:mm")}
              </p>
              <p className="text-xs text-muted-foreground">
                Consultation · Europe/Berlin
              </p>
            </div>
            <ChevronRight aria-hidden="true" className="size-4" />
          </div>
          <div className="relative z-20 mt-3 flex flex-wrap gap-2">
            {upcoming ? (
              <>
                <DialogTrigger
                  onClick={() => setAction("reschedule")}
                  render={
                    <Button
                      variant="outline"
                      className="min-h-11 flex-1 bg-card"
                    />
                  }
                >
                  <CalendarDays aria-hidden="true" />
                  Reschedule
                </DialogTrigger>
                <DialogTrigger
                  onClick={() => setAction("cancel")}
                  render={
                    <Button variant="destructive" className="min-h-11 flex-1" />
                  }
                >
                  <X aria-hidden="true" />
                  Cancel
                </DialogTrigger>
              </>
            ) : (
              <DialogTrigger
                onClick={() => setAction("details")}
                render={
                  <Button variant="outline" className="min-h-11 bg-card" />
                }
              >
                View Details
              </DialogTrigger>
            )}
          </div>
        </div>
      </article>
      {open && action === "details" && (
        <AppointmentDetailsDialog appointmentId={appointment._id} />
      )}
      {open && action === "cancel" && (
        <CancelAppointmentDialog
          appointment={appointment}
          onClose={() => setOpen(false)}
          onBusy={setBusy}
        />
      )}
      {open && action === "reschedule" && (
        <RescheduleAppointmentDialog
          appointment={appointment}
          onClose={() => setOpen(false)}
          onBusy={setBusy}
        />
      )}
    </Dialog>
  );
}
