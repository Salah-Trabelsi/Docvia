import { CalendarDays, LayoutDashboard, Settings, Sparkles, UserRound } from 'lucide-react'
import { NavLink } from 'react-router'

const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/appointments', label: 'My Appointments', icon: CalendarDays },
  { to: '/profile', label: 'My Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNavigation() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-panel lg:hidden">
      <nav aria-label="Patient navigation" className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center text-caption transition-colors ${isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.6} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink to="/assistant" className={({ isActive }) => `mx-auto mt-1 flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg px-4 py-1 text-caption ${isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
        <Sparkles aria-hidden="true" className="size-3.5" />
        <span>AI Assistant</span>
      </NavLink>
    </div>
  )
}

