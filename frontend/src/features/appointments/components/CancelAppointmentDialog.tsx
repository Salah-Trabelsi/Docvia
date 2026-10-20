import { updateAppointmentCache } from "../utils/updateAppointmentCache";
import { useRef } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import {
  appointmentKeys,
  cancelAppointment,
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
import { useAvailabilityClock } from "@/features/doctors/hooks/useAvailabilityClock";
import { useAuth } from "@/features/auth/useAuth";

export function CancelAppointmentDialog({
  appointment,
  onClose,
  onBusy,
}: {
  appointment: PatientAppointment;
  onClose: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const client = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();
  const submitting = useRef(false);
  const now = useAvailabilityClock();
  const mutation = useMutation({
    mutationFn: () => cancelAppointment(appointment._id),
    retry: false,
    onSuccess: async (updated) => {
      await client.cancelQueries({ queryKey: appointmentKeys.all });
      onClose();
      if (user) updateAppointmentCache(client, user._id, updated);
      await Promise.all([
        client.invalidateQueries({ queryKey: appointmentKeys.all }),
        invalidateDoctorAvailability(client),
      ]);
    },
  });
  const status = axios.isAxiosError(mutation.error)
    ? mutation.error.response?.status
    : undefined;
  const eligible =
    appointment.status === "confirmed" &&
    Date.parse(appointment.startsAt) > now;
  const message =
    status === 401
      ? "Your session has expired. Please sign in again."
      : status === 404
        ? "This appointment is no longer available."
        : status === 409
          ? "This appointment can no longer be cancelled. Close this dialog to refresh its status."
          : mutation.isError
            ? "Unable to confirm cancellation. Please try again."
            : undefined;
  return (
    <DialogContent showCloseButton={!mutation.isPending}>
      <DialogHeader>
        <DialogTitle className="pr-8">Cancel this appointment?</DialogTitle>
        <DialogDescription>
          Your consultation
          {appointment.doctorId
            ? ` with Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`
            : ""}{" "}
          on{" "}
          {new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/Berlin",
          }).format(new Date(appointment.startsAt))}{" "}
          (Europe/Berlin) will be cancelled and the time released.
        </DialogDescription>
      </DialogHeader>
      {message && <FieldError>{message}</FieldError>}
      {!eligible && !message && (
        <p role="status">
          Only confirmed future appointments can be cancelled.
        </p>
      )}
      <DialogFooter>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => {
            if (status === 404 || status === 409)
              void client.invalidateQueries({ queryKey: appointmentKeys.all });
            onClose();
          }}
        >
          Keep appointment
        </Button>
        {status === 401 ? (
          <Button
            nativeButton={false}
            render={<Link to="/login" state={{ from: location.pathname }} />}
          >
            Go to Login
          </Button>
        ) : (
          <Button
            variant="destructive"
            disabled={
              !eligible ||
              mutation.isPending ||
              status === 404 ||
              status === 409
            }
            onClick={async () => {
              if (submitting.current || !eligible) return;
              submitting.current = true;
              onBusy(true);
              try {
                await mutation.mutateAsync();
              } catch {
                /* Keep errors visible for retry. */
              } finally {
                submitting.current = false;
                onBusy(false);
              }
            }}
          >
            {mutation.isPending ? "Cancelling..." : "Cancel appointment"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
