import { CalendarDays, CircleUserRound, ShieldCheck, UserRound } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { ProfileAccount } from '../types/account.types'

export function AccountInformation({ account }: { account: ProfileAccount }) {
  return (
    <section aria-labelledby="account-information-heading" className="min-w-0 rounded-xl bg-card p-5 shadow-card">
      <h2 id="account-information-heading" className="text-base font-semibold">Account Information</h2>
      <dl className="mt-4 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-muted-foreground"><UserRound aria-hidden="true" className="size-4 shrink-0" />Account Type</dt>
          <dd>{account.accountType}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />Member Since</dt>
          <dd><time dateTime={account.memberSince}>{format(parseISO(account.memberSince), 'dd MMM yyyy')}</time></dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-muted-foreground"><ShieldCheck aria-hidden="true" className="size-4 shrink-0" />Email Verification</dt>
          <dd className={`rounded-full px-2.5 py-1 ${account.emailVerified ? 'bg-success-subtle text-success' : 'bg-accent text-brand-foreground'}`}>{account.emailVerified ? 'Verified' : 'Not verified'}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-muted-foreground"><CircleUserRound aria-hidden="true" className="size-4 shrink-0" />Account Status</dt>
          <dd className={`rounded-full px-2.5 py-1 ${account.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-muted text-muted-foreground'}`}>{account.status}</dd>
        </div>
      </dl>
    </section>
  )
}

