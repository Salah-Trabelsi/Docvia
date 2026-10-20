import {
  appointmentDateFormatter as date,
  appointmentTimeFormatter as time,
} from "@/features/appointments/utils/appointmentFormatters";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { appointmentKeys, getAppointment } from "@/api/appointments";
import { useAuth } from "@/features/auth/useAuth";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentLoadError } from "./AppointmentLoadError";

export function AppointmentDetailsDialog({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: appointmentKeys.detail(user?._id ?? "", appointmentId),
    queryFn: ({ signal }) => getAppointment(appointmentId, signal),
    enabled: !!user,
    retry: false,
    staleTime: 0,
  });
  const appointment = query.data;
  const doctor = appointment?.doctorId;

  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="pr-8">Appointment details</DialogTitle>
        <DialogDescription>
          {doctor
            ? `Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.specialty ?? ""}`
            : "Your consultation details"}
        </DialogDescription>
      </DialogHeader>
      {query.isPending ? (
        <p role="status">Loading appointment...</p>
      ) : query.isError ? (
        <AppointmentLoadError
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : (
        appointment && (
          <dl className="space-y-4">
            {!doctor && (
              <div className="text-sm text-muted-foreground">
                Doctor information is no longer available.
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">Date</dt>
              <dd>
                <time dateTime={appointment.startsAt}>
                  {date.format(new Date(appointment.startsAt))}
                </time>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Time (Europe/Berlin)
              </dt>
              <dd>
                {time.format(new Date(appointment.startsAt))} &ndash;{" "}
                {time.format(new Date(appointment.endsAt))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="capitalize">{appointment.status}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin aria-hidden="true" className="size-3.5" />
                Practice
              </dt>
              <dd>
                {doctor?.clinic?.name ?? "Practice unavailable"}
                {doctor?.clinic?.city && `, ${doctor.clinic.city}`}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {[
                    doctor?.clinic?.streetAddress,
                    doctor?.clinic?.postalCode,
                    doctor?.clinic?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                {doctor?.clinic?.phone && (
                  <span className="block text-sm">{doctor.clinic.phone}</span>
                )}
              </dd>
            </div>
            {appointment.notes && (
              <div>
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap break-words">
                  {appointment.notes}
                </dd>
              </div>
            )}
          </dl>
        )
      )}
    </DialogContent>
  );
}
