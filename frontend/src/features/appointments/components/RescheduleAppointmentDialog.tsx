import {
  appointmentDateFormatter as dateFormatter,
  appointmentTimeFormatter as timeFormatter,
} from "@/features/appointments/utils/appointmentFormatters";
import { updateAppointmentCache } from "../utils/updateAppointmentCache";
import { useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import {
  appointmentKeys,
  rescheduleAppointment,
  type PatientAppointment,
} from "@/api/appointments";
import { invalidateDoctorAvailability } from "@/features/doctors/queries/invalidateDoctorAvailability";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { useAuth } from "@/features/auth/useAuth";
import { DoctorSlotPicker } from "@/features/doctors/components/DoctorSlotPicker";
import { useDoctorSlotSelection } from "@/features/doctors/hooks/useDoctorSlotSelection";

function appointmentTime(start: string, end: string) {
  return `${dateFormatter.format(new Date(start))}, ${timeFormatter.format(new Date(start))} - ${timeFormatter.format(new Date(end))}`;
}

export function RescheduleAppointmentDialog({
  appointment,
  onClose,
  onBusy,
}: {
  appointment: PatientAppointment;
  onClose: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const [original] = useState(() => appointment);
  const [confirming, setConfirming] = useState(false);
  const [rescheduled, setRescheduled] = useState<PatientAppointment>();
  const submitting = useRef(false);
  const client = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();
  const doctor = original.doctorId;
  const slug = doctor?.slug ?? "";
  const selection = useDoctorSlotSelection(slug, original.startsAt);
  const slot = selection.doctorTimeSlots.find(
    (value) => value.startAt === selection.time,
  );
  const eligible =
    appointment.status === "confirmed" &&
    Date.parse(appointment.startsAt) > selection.now &&
    appointment.startsAt === original.startsAt;
  const canConfirm = eligible && selection.validSelection && !!slot && !!slug;
  const refreshAvailability = () => invalidateDoctorAvailability(client, slug);
  const mutation = useMutation({
    mutationFn: (startsAt: string) =>
      rescheduleAppointment(original._id, startsAt),
    retry: false,
    onSuccess: async (updated) => {
      // The API has committed the change. Render success before cache writes
      // change the appointment prop while this async callback is still pending.
      setRescheduled(updated);
      await client.cancelQueries({ queryKey: appointmentKeys.all });
      if (user) updateAppointmentCache(client, user._id, updated);
      await Promise.all([
        client.invalidateQueries({ queryKey: appointmentKeys.all }),
        refreshAvailability(),
      ]);
    },
    onError: async (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        selection.setTime(undefined);
        setConfirming(false);
        await Promise.all([
          refreshAvailability(),
          client.invalidateQueries({ queryKey: appointmentKeys.all }),
        ]);
      }
    },
  });
  const status = axios.isAxiosError(mutation.error)
    ? mutation.error.response?.status
    : undefined;
  const errorMessage =
    status === 400
      ? "This date or time is not valid. Please choose a different available slot."
      : status === 401
        ? "Your session has expired. Please sign in again."
        : status === 403
          ? "A verified email is required to reschedule. Please verify your email before trying again."
          : status === 404
            ? "This appointment or doctor is no longer available."
            : status === 409
              ? "That slot may have just been booked, or the appointment has changed. Availability has been refreshed; please choose another slot."
              : mutation.isError
                ? "Unable to reschedule your appointment. Please check your connection and try again."
                : undefined;
  const name = doctor
    ? `Dr. ${doctor.firstName} ${doctor.lastName}`
    : "Doctor unavailable";

  return (
    <DialogContent
      className="@container max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"
      showCloseButton={!mutation.isPending}
    >
      <DialogHeader>
        <DialogTitle className="pr-8">
          {rescheduled
            ? "Appointment rescheduled"
            : confirming
              ? "Confirm rescheduling"
              : "Reschedule appointment"}
        </DialogTitle>
        <DialogDescription>
          {name}
          {doctor?.specialty ? ` - ${doctor.specialty}` : ""}. All times are in
          Europe/Berlin.
        </DialogDescription>
      </DialogHeader>
      {rescheduled ? (
        <>
          <p role="status" className="font-medium">
            Your appointment has been rescheduled.
          </p>
          <p className="rounded-xl bg-accent/60 p-4 text-sm">
            {appointmentTime(rescheduled.startsAt, rescheduled.endsAt)}
          </p>
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-muted/60 p-4 text-sm">
            <p className="font-medium">Current appointment</p>
            <p className="mt-1 text-muted-foreground">
              {appointmentTime(original.startsAt, original.endsAt)}
            </p>
          </div>
          {!slug && (
            <FieldError>
              The doctor's availability is unavailable. Please try again later.
            </FieldError>
          )}
          {!mutation.isPending && !eligible && (
            <FieldError>
              Only confirmed future appointments that have not changed can be
              rescheduled. Close this dialog to view the latest appointment.
            </FieldError>
          )}
          {confirming ? (
            <div className="rounded-xl bg-accent/60 p-4 text-sm">
              <p className="font-medium">New appointment</p>
              <p className="mt-1">
                {slot
                  ? appointmentTime(slot.startAt, slot.endAt)
                  : "The selected slot is no longer available."}
              </p>
              {!mutation.isPending && !selection.validSelection && (
                <p role="alert" className="mt-2 text-destructive">
                  Please go back and choose an available date and time.
                </p>
              )}
            </div>
          ) : (
            slug && eligible && <DoctorSlotPicker selection={selection} />
          )}
          {errorMessage && <FieldError>{errorMessage}</FieldError>}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => (confirming ? setConfirming(false) : onClose())}
            >
              {confirming ? "Back" : "Cancel"}
            </Button>
            {status === 401 ? (
              <Button
                nativeButton={false}
                render={
                  <Link to="/login" state={{ from: location.pathname }} />
                }
              >
                Go to Login
              </Button>
            ) : (
              <Button
                disabled={!canConfirm || mutation.isPending || status === 404}
                onClick={async () => {
                  if (
                    submitting.current ||
                    !canConfirm ||
                    !slot ||
                    Date.parse(slot.startAt) <= Date.now() ||
                    Date.parse(original.startsAt) <= Date.now()
                  )
                    return;
                  if (!confirming) {
                    setConfirming(true);
                    return;
                  }
                  submitting.current = true;
                  onBusy(true);
                  try {
                    await mutation.mutateAsync(slot.startAt);
                  } catch {
                    /* Mutation displays the error and allows retry. */
                  } finally {
                    submitting.current = false;
                    onBusy(false);
                  }
                }}
              >
                {mutation.isPending
                  ? "Rescheduling..."
                  : confirming
                    ? "Confirm Reschedule"
                    : "Review Change"}
              </Button>
            )}
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}
