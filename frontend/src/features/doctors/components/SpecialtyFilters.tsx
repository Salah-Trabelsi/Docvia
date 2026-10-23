import type { SpecialtyFilter } from "../types/doctor.types";

const mainSpecialties = [
  "All Specialties",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
] as const;
const additionalSpecialties = [
  "ENT",
  "General Medicine",
  "Ophthalmology",
  "Psychiatry",
] as const;

interface SpecialtyFiltersProps {
  selected: SpecialtyFilter;
  onSelect: (specialty: SpecialtyFilter) => void;
}

export function SpecialtyFilters({
  selected,
  onSelect,
}: SpecialtyFiltersProps) {
  const moreSelected = additionalSpecialties.some(
    (specialty) => specialty === selected,
  );

  return (
    <div
      role="group"
      aria-label="Filter doctors by specialty"
      className="flex gap-2 overflow-x-auto p-1"
    >
      {mainSpecialties.map((specialty) => (
        <button
          key={specialty}
          type="button"
          aria-pressed={selected === specialty}
          onClick={() => onSelect(specialty)}
          className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-medium transition-colors ${selected === specialty ? "bg-foreground text-card" : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          {specialty}
        </button>
      ))}
      <select
        aria-label="More specialties"
        value={moreSelected ? selected : ""}
        onChange={(event) => {
          const specialty = additionalSpecialties.find(
            (item) => item === event.target.value,
          );
          if (specialty) onSelect(specialty);
        }}
        className={`min-h-11 max-w-40 shrink-0 cursor-pointer rounded-full border-0 px-4 text-xs font-medium ${moreSelected ? "bg-foreground text-card" : "bg-card text-muted-foreground"}`}
      >
        <option value="" disabled>
          More
        </option>
        {additionalSpecialties.map((specialty) => (
          <option key={specialty} value={specialty}>
            {specialty}
          </option>
        ))}
      </select>
    </div>
  );
}
