import type { ComponentProps } from "react";
import { Search } from "lucide-react";

export function DoctorSearchInput(props: ComponentProps<"input">) {
  return (
    <>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-3.5 left-4 size-5 text-muted-foreground"
        strokeWidth={1.6}
      />
      <input
        type="search"
        aria-label="Search doctors by name"
        autoComplete="off"
        placeholder="Search doctors by name..."
        className="h-12 w-full min-w-0 rounded-lg border border-transparent bg-background pr-4 pl-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        {...props}
      />
    </>
  );
}
