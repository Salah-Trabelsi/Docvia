import { doctorKeys } from "@/features/doctors/queries/doctorKeys";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { HeartPulse, LogOut, MapPin, Search, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/useAuth";
import { authErrorMessage } from "@/api/auth";
import { getDoctors } from "@/api/doctors";
import { getProfile } from "@/api/profile";
import type { ApiDoctor } from "@/features/doctors/types/apiDoctor.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationOptions, useLocationStore } from "@/stores/locationStore";

export function Header() {
  const { user, logout, isLoggingOut } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: ({ signal }) => getProfile(signal),
    enabled: !!user,
    retry: false,
  });
  const [failedAvatar, setFailedAvatar] = useState<string>();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const { pathname } = useLocation();
  const isOverview = pathname === "/";
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsId = useId();
  const {
    data: doctors = [],
    isPending,
    isError,
  } = useQuery<ApiDoctor[]>({
    queryKey: doctorKeys.list,
    queryFn: getDoctors,
    enabled: isOverview,
  });
  const query = search.trim().replace(/\s+/g, " ").toLowerCase();
  const matches = doctors.filter((doctor) =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(query),
  );
  const showResults = isOverview && searchOpen && query.length > 0;

  useEffect(() => {
    if (!showResults) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !searchRef.current?.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [showResults]);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "My Profile";

  return (
    <header
      className={
        isOverview
          ? "flex min-h-20 flex-wrap items-center gap-3 rounded-xl bg-card p-4 shadow-panel lg:flex-nowrap lg:gap-5"
          : "flex min-h-20 items-center gap-3 rounded-xl bg-card p-4 shadow-panel lg:justify-end lg:gap-0 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none"
      }
    >
      <NavLink
        to="/"
        aria-label="Docvia overview"
        className="mr-auto flex min-h-11 items-center gap-2 rounded-lg lg:hidden"
      >
        <HeartPulse aria-hidden="true" className="size-7 text-primary" />
        <span className="text-xl font-semibold tracking-tight">Docvia</span>
      </NavLink>

      {isOverview && (
        <>
          <div
            ref={searchRef}
            className="relative order-last w-full min-w-0 lg:order-none lg:flex-1"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setSearchOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                searchRef.current?.querySelector("input")?.focus();
                setSearchOpen(false);
              }
            }}
          >
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-3.5 left-4 size-5 text-muted-foreground"
              strokeWidth={1.6}
            />
            <input
              type="search"
              aria-label="Search doctors by name"
              aria-controls={showResults ? resultsId : undefined}
              autoComplete="off"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search doctors by name..."
              className="h-12 w-full min-w-0 rounded-lg border border-transparent bg-background pr-4 pl-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
            {showResults && (
              <div
                id={resultsId}
                className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-panel"
              >
                {isPending || isError || matches.length === 0 ? (
                  <p
                    role="status"
                    className="px-3 py-4 text-sm text-muted-foreground"
                  >
                    {isPending
                      ? "Loading doctors..."
                      : isError
                        ? "Unable to load doctors. Please try again later."
                        : "No doctors found"}
                  </p>
                ) : (
                  <ul aria-label="Matching doctors">
                    {matches.map((doctor) => (
                      <li key={doctor._id}>
                        <Link
                          to={`/doctors/${encodeURIComponent(doctor.slug)}`}
                          onClick={() => {
                            setSearch("");
                            setSearchOpen(false);
                          }}
                          className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                            {doctor.imageUrl ? (
                              <img
                                src={doctor.imageUrl}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <UserRound
                                aria-hidden="true"
                                className="size-6"
                              />
                            )}
                          </span>
                          <span className="min-w-0 break-words text-sm">
                            <span className="block font-medium">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {doctor.specialty}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="order-last w-full min-w-0 lg:order-none lg:w-auto lg:shrink-0">
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
                <MapPin
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.6}
                />
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
          </div>
        </>
      )}

      <div
        className={`ml-auto flex shrink-0 items-center gap-2 lg:gap-4 ${isOverview ? "xl:pl-8" : "lg:rounded-xl lg:bg-card lg:p-4 lg:shadow-panel xl:pl-12"}`}
      >
        <NotificationBell />
        <NavLink
          to="/profile"
          aria-label="My profile"
          className="flex min-h-11 items-center gap-3 rounded-lg"
        >
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-foreground">
            {profile?.avatarUrl && profile.avatarUrl !== failedAvatar ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="size-full object-cover"
                onError={() => setFailedAvatar(profile.avatarUrl)}
              />
            ) : (
              <UserRound
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.6}
              />
            )}
          </span>
          <span className="hidden text-sm font-medium sm:block">
            {displayName}
            <span className="block text-caption font-normal text-muted-foreground">
              {user?.role === "admin" ? "Admin" : "Patient"}
            </span>
          </span>
        </NavLink>
        <div className="relative">
          <button
            type="button"
            disabled={isLoggingOut}
            aria-label={isLoggingOut ? "Signing out..." : "Sign out"}
            title="Sign out"
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
            onClick={async () => {
              setLogoutError("");
              try {
                await logout();
                navigate("/login", { replace: true });
              } catch (error) {
                setLogoutError(authErrorMessage(error));
              }
            }}
          >
            <LogOut aria-hidden="true" className="size-5" strokeWidth={1.6} />
          </button>
          {logoutError && (
            <p
              role="alert"
              className="absolute top-full right-0 z-50 mt-2 w-56 max-w-[80vw] rounded-lg border border-border bg-card p-3 text-sm text-destructive shadow-panel"
            >
              {logoutError}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
