import { CalendarDays, Check, Clock3, Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router";
import { addDays, format } from "date-fns";
import { TZDate } from "react-day-picker";
import type { Doctor } from "../types/doctor.types";
import { bookingDay, bookingTimeZone } from "../utils/availability";
import { useAvailabilityClock } from "../hooks/useAvailabilityClock";
import { useDoctorFavorite } from "../hooks/useFavorites";

interface DoctorCardProps {
  doctor: Doctor;
  nextAvailableDate?: string | null;
  availabilityStatus: "pending" | "error" | "success";
}

export function DoctorCard({
  doctor,
  nextAvailableDate,
  availabilityStatus,
}: DoctorCardProps) {
  const { favorite, disabled, errorMessage, toggle, retry } = useDoctorFavorite(
    doctor.mongoId,
  );
  const name = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const now = useAvailabilityClock();
  const today = bookingDay(now);
  const todayKey = format(today, "yyyy-MM-dd");
  const tomorrowKey = format(addDays(today, 1), "yyyy-MM-dd");
  const availableToday =
    availabilityStatus === "success" && nextAvailableDate === todayKey;
  const hasAvailability =
    availabilityStatus === "success" &&
    !!nextAvailableDate &&
    nextAvailableDate >= todayKey;
  const availabilityLabel =
    availabilityStatus === "pending"
      ? "Loading availability..."
      : availabilityStatus === "error" || nextAvailableDate === undefined
        ? "Availability unavailable"
        : nextAvailableDate === null
          ? "No Availability"
          : nextAvailableDate < todayKey
            ? "Updating availability..."
            : availableToday
              ? "Available Today"
              : nextAvailableDate === tomorrowKey
                ? "Available Tomorrow"
                : `Next Available: ${format(new TZDate(`${nextAvailableDate}T12:00:00Z`, bookingTimeZone), "MMM d")}`;

  return (
    <article className="relative rounded-xl bg-card p-4 text-card-foreground shadow-card transition-shadow hover:shadow-panel">
      <Link
        to={`/doctors/${doctor._id}`}
        aria-label={`View ${name}'s profile`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <button
        type="button"
        aria-label={`${favorite ? "Remove" : "Add"} ${name} ${favorite ? "from" : "to"} favorites`}
        aria-pressed={favorite}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void toggle();
        }}
        className={`absolute top-1 right-1 z-20 flex size-11 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${favorite ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
      >
        <Heart
          aria-hidden="true"
          className="size-4"
          fill={favorite ? "currentColor" : "none"}
          strokeWidth={1.6}
        />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
          <img
            src={doctor.imageUrl}
            alt={name}
            className="size-full object-cover"
          />
        </div>
        <div className="min-w-0 pt-3">
          <h3 className="pr-2 text-sm leading-snug font-semibold">{name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {doctor.professionalTitle}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-1 text-xs">
            <Star
              aria-hidden="true"
              className="size-4 fill-primary text-primary"
            />
            <span className="font-semibold">
              <span className="sr-only">Rated </span>
              {(doctor.rating ?? 0).toFixed(1)}
              <span className="sr-only"> out of 5</span>
            </span>
            <span className="text-muted-foreground">
              ({doctor.reviewCount} reviews)
            </span>
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
          {doctor.yearsOfExperience}+ Years Experience
        </p>
        <p className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          {doctor.city}
        </p>
      </div>
      <p
        role="status"
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${availableToday ? "bg-success-subtle text-success" : hasAvailability ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {availableToday ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Clock3 aria-hidden="true" className="size-3.5" />
        )}
        {availabilityLabel}
      </p>
      {errorMessage && (
        <div
          role="alert"
          className="relative z-20 mt-2 text-xs text-destructive"
        >
          {errorMessage}{" "}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              retry();
            }}
            className="rounded underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Retry
          </button>
        </div>
      )}
    </article>
  );
}
