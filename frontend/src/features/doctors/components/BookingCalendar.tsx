import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Doctor } from "../types/doctor.types";
import { useDoctorSlotSelection } from "../hooks/useDoctorSlotSelection";
import { DoctorSlotPicker } from "./DoctorSlotPicker";
import { BookingConfirmationDialog } from "./BookingConfirmationDialog";

export function BookingCalendar({ doctor }: { doctor: Doctor }) {
  const [bookingSlot, setBookingSlot] = useState<{
    startAt: string;
    endAt: string;
  }>();
  const selection = useDoctorSlotSelection(doctor.slug ?? doctor._id);
  const {
    date,
    time,
    setTime,
    dateUnavailable,
    doctorTimeSlots,
    validSelection,
  } = selection;

  return (
    <section
      aria-labelledby="booking-heading"
      className="rounded-xl bg-card p-5 shadow-card sm:p-8"
    >
      <h2 id="booking-heading" className="text-xl font-semibold">
        Select date and time
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        All appointment times are in Europe/Berlin.
      </p>
      <DoctorSlotPicker selection={selection} />
      <div className="mt-6 border-t pt-5">
        <Button
          className="min-h-11 w-full sm:w-auto sm:px-6"
          disabled={!validSelection || !doctor.mongoId}
          onClick={() => {
            const slot = doctorTimeSlots.find(
              (value) => value.startAt === time,
            );
            if (validSelection && slot) setBookingSlot(slot);
          }}
        >
          Book Appointment
        </Button>
      </div>
      {bookingSlot && (
        <BookingConfirmationDialog
          doctor={doctor}
          slot={bookingSlot}
          available={
            !!date &&
            !dateUnavailable(date) &&
            doctorTimeSlots.some((slot) => slot.startAt === bookingSlot.startAt)
          }
          onClose={() => setBookingSlot(undefined)}
          onUnavailable={() => setTime(undefined)}
        />
      )}
    </section>
  );
}
