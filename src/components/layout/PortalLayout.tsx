import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Search, Bell, LogOut, ChevronDown, ExternalLink, ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { CREDIT, SYSTEM_NAME } from '@/lib/brand'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui'
import { Logo } from './Logo'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: number
}

export function PortalLayout({
  nav,
  basePath,
  title,
  subtitle,
  accent = 'dark',
  topRight,
  searchPlaceholder = 'Search…',
  onSearch,
  backToStoreLabel = 'Back to store',
  children,
}: {
  nav: NavItem[]
  basePath: string
  title: string
  subtitle?: string
  accent?: 'dark' | 'brand'
  topRight?: ReactNode
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  backToStoreLabel?: string
  children?: ReactNode
}) {
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const sidebar = (
    <nav className="flex-1 space-y-1 p-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
            )
          }
        >
          {item.icon}
          <span className="flex-1">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const sidebarInner = (
    <>
      <div className="flex h-16 items-center border-b border-ink-100 px-5">
        <Logo />
      </div>
      <div className="px-5 pt-5">
        <p className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
      </div>
      {sidebar}
      <div className="border-t border-ink-100 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
        >
          <ExternalLink className="size-4.5" /> {backToStoreLabel}
        </Link>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        {sidebarInner}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="animate-scale-in absolute inset-y-0 left-0 flex w-72 flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="text-ink-500" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn('sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur', accent === 'dark' ? '' : '')}>
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold text-ink-900">{title}</h1>
              {subtitle && <p className="hidden truncate text-xs text-ink-500 sm:block">{subtitle}</p>}
            </div>

            {onSearch && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onSearch(q)
                }}
                className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-ink-200 px-3 lg:flex"
              >
                <Search className="size-4 text-ink-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </form>
            )}

            {topRight}

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl py-1 pr-1 pl-1 transition hover:bg-ink-100"
              >
                <Avatar name={user?.name ?? 'Guest'} color={user?.avatarColor} size={32} />
                <ChevronDown className="size-3.5 text-ink-400" />
              </button>
              {menuOpen && (
                <div className="animate-scale-in absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                    <p className="truncate text-xs text-ink-500">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to={basePath}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
                    >
                      <ArrowLeft className="size-4" /> {backToStoreLabel}
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        navigate('/')
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children ?? <Outlet />}</main>

        <footer className="px-4 pb-6 text-center text-[11px] font-medium text-ink-400 sm:px-6 lg:px-8">
          {SYSTEM_NAME} · {CREDIT}
        </footer>
      </div>
    </div>
  )
}

export function NotificationBell({ count = 3 }: { count?: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-10 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>
      {open && (
        <div className="animate-scale-in absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
          <p className="border-b border-ink-100 px-4 py-3 text-sm font-semibold text-ink-900">Notifications</p>
          <ul className="divide-y divide-ink-100">
            {[
              ['12 orders awaiting fulfilment', '3 minutes ago', 'brand'],
              ['4 new reviews need moderation', '1 hour ago', 'amber'],
              ['Low stock: Halo Studio Over-Ear', '4 hours ago', 'red'],
            ].map(([text, time, tone]) => (
              <li key={text} className="flex gap-3 px-4 py-3">
                <span
                  className={cn(
                    'mt-1 size-2 shrink-0 rounded-full',
                    tone === 'brand' ? 'bg-brand-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-red-500',
                  )}
                />
                <div>
                  <p className="text-[13px] font-medium text-ink-800">{text}</p>
                  <p className="text-xs text-ink-400">{time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
