import {
  appointmentDateFormatter as dateFormatter,
  appointmentTimeFormatter as timeFormatter,
} from "@/features/appointments/utils/appointmentFormatters";
import { doctorKeys } from "@/features/doctors/queries/doctorKeys";
import { useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import { appointmentKeys, bookAppointment } from "@/api/appointments";
import type { DoctorAvailabilityResponse } from "@/api/doctors";
import { invalidateDoctorAvailability } from "../queries/invalidateDoctorAvailability";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import type { Doctor } from "../types/doctor.types";
import { useAvailabilityClock } from "../hooks/useAvailabilityClock";

interface Props {
  doctor: Doctor;
  slot: { startAt: string; endAt: string };
  available: boolean;
  onClose: () => void;
  onUnavailable: () => void;
}

export function BookingConfirmationDialog({
  doctor,
  slot,
  available,
  onClose,
  onUnavailable,
}: Props) {
  const [notes, setNotes] = useState("");
  const submitting = useRef(false);
  const client = useQueryClient();
  const location = useLocation();
  const now = useAvailabilityClock();
  const slug = doctor.slug ?? doctor._id;
  const refreshAvailability = async () => {
    await client.cancelQueries({ queryKey: doctorKeys.availability(slug) });
    // Only remove a slot after the server confirms booking or reports a conflict.
    client.setQueriesData<DoctorAvailabilityResponse>(
      { queryKey: doctorKeys.availability(slug) },
      (old) =>
        old && {
          ...old,
          slots: old.slots.filter((value) => value.startAt !== slot.startAt),
        },
    );
    await invalidateDoctorAvailability(client, slug);
  };
  const mutation = useMutation({
    mutationFn: () => {
      if (!doctor.mongoId || !/^[a-f\d]{24}$/i.test(doctor.mongoId))
        throw new Error("Doctor ID is unavailable. Please refresh this page.");
      return bookAppointment({
        doctorId: doctor.mongoId,
        startsAt: slot.startAt,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
    },
    retry: false,
    onSuccess: async () => {
      onUnavailable();
      await Promise.all([
        refreshAvailability(),
        client.invalidateQueries({ queryKey: appointmentKeys.all }),
      ]);
    },
    onError: async (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        onUnavailable();
        await refreshAvailability();
      }
    },
  });
  const status = axios.isAxiosError(mutation.error)
    ? mutation.error.response?.status
    : undefined;
  const errorMessage =
    status === 409
      ? "This time is no longer available. Close this dialog and choose another appointment time."
      : status === 403
        ? "Booking requires a verified patient account. Please verify your email before booking."
        : status === 401
          ? "Your session has expired. Please sign in to book your appointment."
          : mutation.isError
            ? "We could not confirm your booking. Check My Appointments before retrying if your connection was interrupted."
            : undefined;
  const valid =
    available &&
    new Date(slot.startAt).getTime() > now &&
    notes.length <= 1000 &&
    !!doctor.mongoId;
  const start = new Date(mutation.data?.startsAt ?? slot.startAt);
  const end = new Date(mutation.data?.endsAt ?? slot.endAt);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!mutation.isPending}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            {mutation.isSuccess
              ? "Appointment confirmed"
              : "Confirm your appointment"}
          </DialogTitle>
          <DialogDescription>
            {mutation.isSuccess
              ? "Your appointment has been booked successfully."
              : "Review your appointment details before confirming."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 rounded-xl bg-accent p-4">
          <div>
            <p className="font-semibold">
              Dr. {doctor.firstName} {doctor.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
          </div>
          <p>
            {dateFormatter.format(start)}
            <span className="block text-sm text-muted-foreground">
              {timeFormatter.format(start)} – {timeFormatter.format(end)}{" "}
              (Europe/Berlin)
            </span>
          </p>
          <div className="break-words text-sm">
            <p className="font-medium">{doctor.practice.name}</p>
            <p className="text-muted-foreground">
              {doctor.practice.address}
              {doctor.practice.address && ", "}
              {doctor.practice.city}
            </p>
          </div>
        </div>
        {mutation.isSuccess ? (
          <>
            <p role="status" className="text-sm">
              Your booking is confirmed.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button nativeButton={false} render={<Link to="/appointments" />}>
                View My Appointments
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="space-y-4"
            aria-busy={mutation.isPending}
            onSubmit={async (event) => {
              event.preventDefault();
              if (
                submitting.current ||
                !valid ||
                status === 401 ||
                status === 409
              )
                return;
              submitting.current = true;
              try {
                await mutation.mutateAsync();
              } catch {
                /* Display the request error below. */
              } finally {
                submitting.current = false;
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="appointment-notes">
                Appointment note (optional)
              </Label>
              <Textarea
                id="appointment-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                disabled={mutation.isPending}
                aria-describedby="appointment-note-limit"
                className="min-h-24"
              />
              <p
                id="appointment-note-limit"
                className="text-xs text-muted-foreground"
              >
                {notes.length}/1000 characters
              </p>
            </div>
            {errorMessage && <FieldError>{errorMessage}</FieldError>}
            {!valid && !errorMessage && (
              <p role="status" className="text-sm text-muted-foreground">
                This time is no longer available. Please choose another time.
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={onClose}
              >
                Cancel
              </Button>
              {status === 401 ? (
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      to="/login"
                      state={{ from: location.pathname + location.search }}
                    />
                  }
                >
                  Go to Login
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!valid || mutation.isPending || status === 409}
                >
                  {mutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
