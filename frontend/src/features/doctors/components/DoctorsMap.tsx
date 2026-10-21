import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Map, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { DoctorMapPreview } from "./DoctorMapPreview";
import type { Doctor } from "../types/doctor.types";
import { cityCoordinates, useLocationStore } from "@/stores/locationStore";

setWorkerUrl(workerUrl);

export function DoctorsMap({ doctors }: { doctors: Doctor[] }) {
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const cameraCityRef = useRef(selectedCity);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePractice, setActivePractice] = useState<string | null>(null);
  const chooserRef = useRef<HTMLElement>(null);
  const markersRef = useRef<
    { marker: Marker; doctorIds: string[]; practiceKey: string }[]
  >([]);
  const practiceDoctors = doctors.filter(
    (doctor) =>
      doctor.practice.location.coordinates.join(",") === activePractice,
  );
  const selectedDoctor = doctors.find((doctor) => doctor._id === selectedId);

  // Clear selection immediately when the shared filter removes that doctor.
  if (selectedId !== null && !selectedDoctor) setSelectedId(null);
  if (activePractice !== null && practiceDoctors.length === 0)
    setActivePractice(null);

  useEffect(() => {
    if (activePractice) chooserRef.current?.focus({ preventScroll: true });
  }, [activePractice]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;
    let observer: ResizeObserver | undefined;

    try {
      const initialCity = useLocationStore.getState().selectedCity;
      cameraCityRef.current = initialCity;
      const map = new Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/bright",
        center:
          cityCoordinates[
            initialCity === "All locations" ? "Baden-Baden" : initialCity
          ],
        zoom: initialCity === "All locations" ? 8.5 : 10.5,
        attributionControl: { compact: false },
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(
        new NavigationControl({ showCompass: false }),
        "top-right",
      );
      map
        .getCanvas()
        .setAttribute(
          "aria-label",
          `Interactive map around ${initialCity === "All locations" ? "Baden-Baden" : initialCity}. Use arrow keys to pan and plus or minus to zoom.`,
        );
      map.on("load", () => {
        if (!disposed) setStatus("ready");
      });
      map.on("error", () => {
        if (!disposed) setStatus("error");
      });

      observer = new ResizeObserver(() => map.resize());
      observer.observe(containerRef.current);
    } catch {
      // WebGL may be unavailable; leave the rest of the Overview usable.
      queueMicrotask(() => {
        if (!disposed) setStatus("error");
      });
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || cameraCityRef.current === selectedCity) return;
    cameraCityRef.current = selectedCity;
    map
      .getCanvas()
      .setAttribute(
        "aria-label",
        `Interactive doctors map. Use arrow keys to pan and plus or minus to zoom.`,
      );
    map.flyTo({
      center:
        cityCoordinates[
          selectedCity === "All locations" ? "Baden-Baden" : selectedCity
        ],
      zoom: selectedCity === "All locations" ? 8.5 : 10.5,
      duration: 1200,
    });
  }, [selectedCity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const practices = new globalThis.Map<string, Doctor[]>();
    for (const doctor of doctors) {
      const key = doctor.practice.location.coordinates.join(",");
      const group = practices.get(key) ?? [];
      group.push(doctor);
      practices.set(key, group);
    }

    const cleanups: (() => void)[] = [];
    markersRef.current = [...practices.values()].map((group) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "group flex size-11 items-end justify-center rounded-lg bg-transparent text-primary data-[selected=true]:text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
      // Static SVG geometry: its bottom tip is anchored to the practice coordinates.
      // A transparent 44px button retains a usable touch target around the compact pin.
      button.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38" aria-hidden="true" class="drop-shadow-sm group-data-[selected=true]:drop-shadow-md"><path d="M15 37C12 32 1 22 1 15a14 14 0 0 1 28 0c0 7-11 17-14 22Z" fill="currentColor" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><circle cx="15" cy="15" r="5" fill="white"/></svg>';
      if (group.length > 1) {
        const count = document.createElement("span");
        count.className =
          "absolute top-0 right-0 flex size-4 items-center justify-center rounded-full border border-card bg-foreground text-[10px] font-semibold text-card";
        count.textContent = String(group.length);
        count.setAttribute("aria-hidden", "true");
        button.append(count);
      }
      const practiceKey = group[0].practice.location.coordinates.join(",");
      button.setAttribute(
        "aria-label",
        group.length > 1
          ? `${group.length} doctors at ${group[0].practice.name}, ${group[0].practice.city}`
          : `View Dr. ${group[0].firstName} ${group[0].lastName} on map`,
      );
      button.setAttribute("aria-pressed", "false");
      const selectDoctor = () => {
        setSelectedId(group.length === 1 ? group[0]._id : null);
        setActivePractice(group.length > 1 ? practiceKey : null);
        // Keep the chosen marker above the preview without changing zoom.
        // Specialty filtering never changes the camera; city changes use flyTo.
        const height = map.getContainer().clientHeight;
        const markerY = height < 500 ? 56 : 120;
        map.easeTo({
          center: group[0].practice.location.coordinates,
          offset: [0, markerY - height / 2],
          duration: 200,
        });
      };
      button.addEventListener("click", selectDoctor);
      const marker = new Marker({ element: button, anchor: "bottom" })
        .setLngLat(group[0].practice.location.coordinates)
        .addTo(map);
      cleanups.push(() => {
        button.removeEventListener("click", selectDoctor);
        marker.remove();
      });
      return {
        marker,
        doctorIds: group.map((doctor) => doctor._id),
        practiceKey,
      };
    });

    const updateVisibility = () => {
      const bounds = map.getBounds();
      for (const { marker } of markersRef.current) {
        marker.getElement().style.display = bounds.contains(marker.getLngLat())
          ? "flex"
          : "none";
      }
    };
    updateVisibility();
    map.on("moveend", updateVisibility);
    map.on("resize", updateVisibility);

    return () => {
      map.off("moveend", updateVisibility);
      map.off("resize", updateVisibility);
      cleanups.forEach((cleanup) => cleanup());
      markersRef.current = [];
    };
  }, [doctors]);

  useEffect(() => {
    for (const { marker, doctorIds, practiceKey } of markersRef.current) {
      const selected =
        (selectedId !== null && doctorIds.includes(selectedId)) ||
        practiceKey === activePractice;
      marker.getElement().dataset.selected = String(selected);
      marker.getElement().setAttribute("aria-pressed", String(selected));
    }
  }, [doctors, selectedId, activePractice]);

  const closePreview = () => {
    markersRef.current
      .find(
        (item) =>
          (selectedId && item.doctorIds.includes(selectedId)) ||
          item.practiceKey === activePractice,
      )
      ?.marker.getElement()
      .focus({ preventScroll: true });
    setSelectedId(null);
    setActivePractice(null);
  };

  return (
    <section
      aria-label={
        selectedCity === "All locations"
          ? "Doctors map across all locations"
          : `Doctors map around ${selectedCity}`
      }
      className="relative min-w-0 overflow-hidden rounded-xl bg-card shadow-card"
    >
      <div
        ref={containerRef}
        className="h-[28rem] w-full sm:h-[32rem] lg:h-[37rem]"
      />
      {activePractice && practiceDoctors.length > 0 && (
        <section
          ref={chooserRef}
          tabIndex={-1}
          aria-labelledby="practice-chooser-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") closePreview();
          }}
          className="absolute right-3 bottom-10 left-3 z-10 max-h-[calc(100%-8rem)] overflow-y-auto overscroll-contain rounded-xl bg-card p-4 text-card-foreground shadow-card"
        >
          <button
            type="button"
            aria-label="Close practice selection"
            onClick={closePreview}
            className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
          <h3
            id="practice-chooser-title"
            className="pr-8 text-sm font-semibold"
          >
            Doctors at this location
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {practiceDoctors[0].practice.name} &middot;{" "}
            {practiceDoctors[0].practice.city}
          </p>
          <ul className="mt-3 space-y-1">
            {practiceDoctors.map((doctor) => (
              <li key={doctor._id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(doctor._id);
                    setActivePractice(null);
                  }}
                  className="min-h-11 w-full rounded-lg px-3 py-2 text-left hover:bg-accent focus-visible:bg-accent"
                >
                  <span className="block text-sm font-medium">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {doctor.professionalTitle}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {selectedDoctor && (
        <DoctorMapPreview
          doctor={selectedDoctor}
          practiceDoctors={doctors.filter(
            (doctor) =>
              doctor.practice.location.coordinates.join(",") ===
              selectedDoctor.practice.location.coordinates.join(","),
          )}
          onSelect={setSelectedId}
          onClose={closePreview}
        />
      )}
      {status !== "ready" && (
        <p
          role="status"
          className="pointer-events-none absolute top-3 right-14 left-3 rounded-lg bg-card/95 px-3 py-2 text-sm text-muted-foreground shadow-panel"
        >
          {status === "loading"
            ? "Loading map…"
            : "The map could not load. Check your connection and WebGL support, then refresh to try again."}
        </p>
      )}
    </section>
  );
}
