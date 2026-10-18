import type { ReactNode } from 'react'
import { HeartPulse } from 'lucide-react'
import { Link } from 'react-router'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="flex min-h-svh items-center justify-center bg-background bg-cover bg-center bg-no-repeat px-4 py-8 sm:px-6 sm:py-12"
      style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/banners/background-login-register.png')` }}
    >
      <div className="w-full max-w-[30rem] rounded-3xl border border-border/40 bg-card px-6 py-8 text-card-foreground shadow-panel sm:px-10 sm:py-10">
        <Link to="/" aria-label="Docvia overview" className="mx-auto mb-8 flex w-fit flex-col items-center gap-1 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
          <HeartPulse aria-hidden="true" className="size-16 text-primary" strokeWidth={2.5} />
          <span className="text-4xl font-semibold tracking-tight">Docvia</span>
        </Link>
        {children}
      </div>
    </main>
  )
}
