import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationOptions, useLocationStore } from "@/stores/locationStore";

export function DoctorLocationFilter() {
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);

  return (
    <Select
      value={selectedCity}
      onValueChange={(value) => {
        const city = locationOptions.find((item) => item === value);
        if (city) setSelectedCity(city);
      }}
    >
      <SelectTrigger
        aria-label="Choose location"
        className="min-h-11 w-full gap-3 border-border bg-card px-3 lg:w-48 xl:w-56"
      >
        <MapPin aria-hidden="true" className="size-5" strokeWidth={1.6} />
        <SelectValue>{selectedCity}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {locationOptions.map((city) => (
          <SelectItem key={city} value={city} className="min-h-11">
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
