import { useId } from 'react'
import { Switch } from '@base-ui/react/switch'
import { Bell, CalendarCheck, CalendarClock, Mail } from 'lucide-react'

export interface NotificationSettings {
  reminders: boolean
  updates: boolean
  promotional: boolean
  system: boolean
}

const options = [
  { key: 'reminders', title: 'Appointment Reminders', description: 'Reminders before your upcoming consultations.', icon: CalendarClock },
  { key: 'updates', title: 'Appointment Updates', description: 'Updates about changes to your appointments.', icon: CalendarCheck },
  { key: 'promotional', title: 'Promotional Emails', description: 'News and optional offers from docvia.', icon: Mail },
  { key: 'system', title: 'System Notifications', description: 'General account and service updates.', icon: Bell },
] as const

export function NotificationPreferences({ value, onChange }: { value: NotificationSettings; onChange: (key: keyof NotificationSettings, checked: boolean) => void }) {
  const id = useId()
  return <section aria-labelledby={`${id}-heading`} className="min-w-0 rounded-xl bg-card p-5 shadow-card">
    <h2 id={`${id}-heading`} className="text-lg font-semibold">Notification Preferences</h2>
    <div className="mt-2 divide-y divide-border">
      {options.map(({ key, title, description, icon: Icon }) => <div key={key} className="flex items-start gap-3 py-4">
        <Icon aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1"><label htmlFor={`${id}-${key}`} className="text-sm font-medium">{title}</label><p id={`${id}-${key}-description`} className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p></div>
        <Switch.Root id={`${id}-${key}`} checked={value[key]} onCheckedChange={checked => onChange(key, checked)} aria-describedby={`${id}-${key}-description${key === 'system' ? ` ${id}-security-note` : ''}`} className="group relative flex h-11 w-11 shrink-0 cursor-pointer items-center rounded-full before:absolute before:inset-x-0 before:top-2.5 before:h-6 before:rounded-full before:bg-muted before:ring-1 before:ring-border data-checked:before:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Switch.Thumb className="relative ml-0.5 size-5 rounded-full bg-white shadow-sm transition-transform group-data-checked:translate-x-5" />
        </Switch.Root>
      </div>)}
    </div>
    <p id={`${id}-security-note`} className="mt-2 text-xs leading-relaxed text-muted-foreground">Critical security notifications cannot be disabled. These switches are local preferences only and are not saved.</p>
  </section>
}

