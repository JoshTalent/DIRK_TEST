import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { CREDIT } from '@/lib/brand'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <div className="text-center text-sm text-ink-500">{footer}</div>
        <p className="mt-4 text-center text-[11px] font-semibold text-ink-400">{CREDIT}</p>
      </div>

      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-ink-950 to-ink-950" />
        <div className="absolute -top-20 -right-16 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 size-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-14 text-white">
          {aside ?? (
            <>
              <h2 className="max-w-md text-3xl font-extrabold tracking-tight">
                Everything in one bag. One checkout. One company that answers the phone.
              </h2>
              <ul className="mt-8 space-y-4">
                {[
                  'Free express delivery on orders over RWF 99',
                  '30-day returns with a prepaid label in the box',
                  'Two-year warranty on every single product',
                  'Real support, median 47-minute first reply',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-white/80">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Check className="size-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function DemoAccounts() {
  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
      <p className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">Demo accounts</p>
      <div className="mt-3 space-y-2">
        {[
          { role: 'Customer', email: 'customer@demo.com', pass: 'demo1234' },
          { role: 'Administrator', email: 'admin@demo.com', pass: 'admin1234' },
        ].map((a) => (
          <div key={a.email} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-ink-200 ring-inset">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-900">{a.role}</p>
              <p className="truncate font-mono text-[11px] text-ink-500">
                {a.email} · {a.pass}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuthFooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-brand-700 hover:underline">
      {children}
    </Link>
  )
}
