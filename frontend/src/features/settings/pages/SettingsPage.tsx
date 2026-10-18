import { useState } from 'react'
import { Bell, LockKeyhole, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react'
import { AccountSettings } from '../components/AccountSettings'
import { NotificationPreferences, type NotificationSettings } from '../components/NotificationPreferences'
import { SettingsBanner } from '../components/SettingsBanner'

const sections = [
  { name: 'Account', icon: UserRound },
  { name: 'Notifications', icon: Bell },
  { name: 'Privacy', icon: LockKeyhole },
  { name: 'Preferences', icon: SlidersHorizontal },
  { name: 'Security', icon: ShieldCheck },
] as const
type Section = typeof sections[number]['name']

export function SettingsPage() {
  const [section, setSection] = useState<Section>('Account')
  const [notifications, setNotifications] = useState<NotificationSettings>({ reminders: true, updates: true, promotional: false, system: true })
  const descriptions: Partial<Record<Section, string>> = {
    Notifications: 'Choose which appointment and service updates you want to receive using Notification Preferences. Critical security messages remain enabled.',
    Privacy: 'Privacy controls are coming soon. No privacy settings can be changed yet.',
    Preferences: 'Additional display and language preferences are coming soon.',
  }

  return <div className="min-w-0 space-y-5">
    <SettingsBanner />
    <div className="grid min-w-0 grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,20fr)_minmax(0,45fr)_minmax(0,35fr)] xl:items-stretch">
      <nav aria-label="Settings sections" className="flex flex-wrap gap-1 rounded-xl bg-card p-3 shadow-card md:col-span-2 xl:col-span-1 xl:flex-col">
        {sections.map(({ name, icon: Icon }) => <button key={name} type="button" aria-pressed={section === name} aria-controls="settings-content" onClick={() => setSection(name)} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring ${section === name ? 'bg-accent font-medium text-brand-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon aria-hidden="true" className="size-5 shrink-0" />{name}</button>)}
      </nav>
      <div id="settings-content" className="min-w-0 xl:flex xl:flex-col xl:[&>section]:flex-1">
        {section === 'Account' || section === 'Security' ? <AccountSettings key={section} securityOnly={section === 'Security'} /> : <section aria-labelledby="settings-section-heading" className="rounded-xl bg-card p-5 shadow-card"><h2 id="settings-section-heading" className="text-lg font-semibold">{section}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{descriptions[section]}</p></section>}
      </div>
      <NotificationPreferences value={notifications} onChange={(key, checked) => setNotifications(current => ({ ...current, [key]: checked }))} />
    </div>
  </div>
}

