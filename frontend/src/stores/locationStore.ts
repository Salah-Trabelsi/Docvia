import { create } from "zustand";

export const cities = [
  "Baden-Baden",
  "Karlsruhe",
  "Rastatt",
  "Ettlingen",
  "Offenburg",
] as const;
export type City = (typeof cities)[number];
export const locationOptions = ["All locations", ...cities] as const;
export type LocationSelection = (typeof locationOptions)[number];

export const cityCoordinates: Record<City, [number, number]> = {
  "Baden-Baden": [8.2408, 48.7606],
  Karlsruhe: [8.4037, 49.0069],
  Rastatt: [8.2044, 48.8572],
  Ettlingen: [8.4044, 48.9409],
  Offenburg: [7.9448, 48.4735],
};

interface LocationState {
  selectedCity: LocationSelection;
  setSelectedCity: (city: LocationSelection) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  selectedCity: "All locations",
  setSelectedCity: (selectedCity) => set({ selectedCity }),
}));
