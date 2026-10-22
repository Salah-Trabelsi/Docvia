import {
  CalendarDays,
  LayoutDashboard,
  LayoutGrid,
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

export function MobileNavigation() {
  return (
    <>
      <nav
        aria-label="Patient navigation"
        className="fixed inset-x-0 bottom-0 z-20 grid h-[calc(4.25rem+env(safe-area-inset-bottom))] grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {[
          ...items.map((item) =>
            item.to === "/" ? { ...item, icon: LayoutGrid } : item,
          ),
          { to: "/assistant", label: "AI Assistant", icon: Sparkles },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex h-17 min-w-0 flex-col items-center justify-center gap-1 text-center text-[clamp(0.5rem,2.3vw,0.6875rem)] leading-tight tracking-tight whitespace-nowrap transition-colors focus-visible:outline-offset-[-3px] ${isActive ? "font-medium text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-10 items-center justify-center rounded-xl ${isActive ? "bg-accent" : ""}`}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5 shrink-0"
                    strokeWidth={1.6}
                  />
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="fixed inset-x-0 bottom-0 z-20 hidden border-t bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-panel sm:block lg:hidden">
        <nav
          aria-label="Patient navigation"
          className="mx-auto grid max-w-lg grid-cols-4 gap-1"
        >
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center text-caption transition-colors ${isActive ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
              }
            >
              <Icon
                aria-hidden="true"
                className="size-5 shrink-0"
                strokeWidth={1.6}
              />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink
          to="/assistant"
          className={({ isActive }) =>
            `mx-auto mt-1 flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg px-4 py-1 text-caption ${isActive ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
          }
        >
          <Sparkles aria-hidden="true" className="size-3.5" />
          <span>AI Assistant</span>
        </NavLink>
      </div>
    </>
  );
}
