import {
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router";

const items = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/appointments", label: "My Appointments", icon: CalendarDays },
  { to: "/profile", label: "My Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-62 flex-col overflow-y-auto rounded-r-xl border-r border-sidebar-border bg-sidebar px-6 py-8 lg:flex">
      <NavLink
        to="/"
        aria-label="Docvia overview"
        className="mb-8 flex min-h-11 items-center gap-3 rounded-lg px-3"
      >
        <HeartPulse
          aria-hidden="true"
          className="size-8 shrink-0 text-primary"
          strokeWidth={2.5}
        />
        <span className="text-2xl font-semibold tracking-tight">Docvia</span>
      </NavLink>

      <nav aria-label="Patient navigation" className="shrink-0 space-y-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${isActive ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
            }
          >
            <Icon
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={1.6}
            />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 shrink-0 border-t pt-5">
        <NavLink
          to="/assistant"
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm ${isActive ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
          }
        >
          <Sparkles
            aria-hidden="true"
            className="size-5 shrink-0"
            strokeWidth={1.6}
          />
          <span>AI Assistant</span>
        </NavLink>
      </div>
    </aside>
  );
}
