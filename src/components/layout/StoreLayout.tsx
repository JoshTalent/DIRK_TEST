import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Package,
  LayoutDashboard,
  LogOut,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { categories } from '@/data/catalog'
import { money } from '@/lib/format'
import { CREDIT } from '@/lib/brand'
import { cn } from '@/lib/cn'
import { listProducts } from '@/api/products'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { Avatar, Badge, Button } from '@/components/ui'
import { CategoryIcon, ProductImage } from '@/components/product/ProductImage'
import { Logo } from './Logo'
import type { Product } from '@/lib/types'

const ANNOUNCEMENTS = [
  'Free express shipping on orders over RWF 99 — this week only',
  'New season audio drop: up to 30% off flagship headphones',
  'Extended 30-day returns and free 2-year warranty on everything',
]

function AnnouncementBar() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % ANNOUNCEMENTS.length), 5200)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="bg-ink-950 text-white">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-[12.5px] font-medium tracking-wide">
        <span key={i} className="animate-fade-up text-center">{ANNOUNCEMENTS[i]}</span>
      </div>
    </div>
  )
}

function SearchBox({ onNavigate }: { onNavigate?: () => void }) {
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const boxRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!term.trim()) {
      setResults([])
      return
    }
    const t = window.setTimeout(() => {
      listProducts({ q: term, perPage: 5 }).then((r) => setResults(r.items))
    }, 220)
    return () => window.clearTimeout(t)
  }, [term])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setOpen(false)
          onNavigate?.()
          navigate(`/shop?q=${encodeURIComponent(term)}`)
        }}
        className="flex h-10 w-full items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10"
      >
        <Search className="size-4 shrink-0 text-ink-400" />
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for headphones, laptops, cameras…"
          className="h-full w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        {term && (
          <button type="button" onClick={() => setTerm('')} className="text-ink-400 hover:text-ink-700" aria-label="Clear">
            <X className="size-3.5" />
          </button>
        )}
      </form>

      {open && term.trim() && (
        <div className="animate-scale-in absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl shadow-ink-950/10">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500">No products match “{term}”.</p>
          ) : (
            <>
              <ul className="max-h-96 overflow-y-auto p-1.5">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/product/${p.slug}`}
                      onClick={() => {
                        setOpen(false)
                        onNavigate?.()
                      }}
                      className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-ink-50"
                    >
                      <ProductImage product={p} className="size-10 shrink-0 rounded-lg" iconSize="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink-800">{p.name}</p>
                        <p className="text-xs text-ink-500">{p.brand}</p>
                      </div>
                      <span className="text-[13px] font-semibold text-ink-900">{money(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setOpen(false)
                  onNavigate?.()
                  navigate(`/shop?q=${encodeURIComponent(term)}`)
                }}
                className="flex w-full items-center justify-between border-t border-ink-100 px-4 py-3 text-[13px] font-semibold text-brand-700 transition hover:bg-ink-50"
              >
                See all results for “{term}”
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AccountMenu() {
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex size-10 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
        aria-label="Sign in"
      >
        <User className="size-5" />
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl py-1 pr-2 pl-1 transition hover:bg-ink-100"
      >
        <Avatar name={user.name} color={user.avatarColor} size={32} />
        <ChevronRight className={cn('size-3.5 text-ink-400 transition', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="animate-scale-in absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl shadow-ink-950/10">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
          </div>
          <div className="p-1.5">
            {user.role === 'admin' ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
              >
                <LayoutDashboard className="size-4" /> Admin dashboard
              </Link>
            ) : null}
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
            >
              <User className="size-4" /> My account
            </Link>
            <Link
              to="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
            >
              <Package className="size-4" /> Orders
            </Link>
            <Link
              to="/account/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
            >
              <Heart className="size-4" /> Wishlist
            </Link>
            <button
              onClick={() => {
                logout()
                setOpen(false)
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
  )
}

const PERKS = [
  { icon: Truck, title: 'Free shipping over RWF 99', sub: 'Express delivery in 1–2 days' },
  { icon: RotateCcw, title: '30-day free returns', sub: 'No questions, no restocking fee' },
  { icon: ShieldCheck, title: '2-year warranty', sub: 'On every item we sell' },
  { icon: Headphones, title: 'Expert support', sub: 'Real humans, 7 days a week' },
]

function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-200 bg-white">
      <div className="border-b border-ink-100">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <p.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{p.title}</p>
                <p className="text-[13px] text-ink-500">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
            TEST builds considered technology for people who keep things. Every product is tested in-house for two
            years before it earns a place on this page.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Apple Pay', 'Visa', 'Mastercard', 'Amex', 'PayPal'].map((p) => (
              <span key={p} className="rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                {p}
              </span>
            ))}
          </div>
        </div>

        {[
          { title: 'Shop', links: categories.slice(0, 5).map((c) => ({ label: c.name, to: `/shop?category=${c.slug}` })) },
          {
            title: 'Support',
            links: [
              { label: 'Track your order', to: '/track' },
              { label: 'Shipping & delivery', to: '/help' },
              { label: 'Returns & refunds', to: '/help' },
              { label: 'Warranty', to: '/help' },
              { label: 'Contact us', to: '/contact' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About TEST', to: '/about' },
              { label: 'Sustainability', to: '/about' },
              { label: 'Careers', to: '/about' },
              { label: 'Press', to: '/about' },
              { label: 'Admin demo', to: '/admin' },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-[13px] font-semibold tracking-wide text-ink-900 uppercase">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-ink-500 transition hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-[13px] text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} TEST Retail Ltd. A fictional demo storefront.</p>
          <div className="flex items-center gap-5">
            <span className="font-semibold text-ink-700">{CREDIT}</span>
            <Link to="/help" className="hover:text-ink-800">Privacy</Link>
            <Link to="/help" className="hover:text-ink-800">Terms</Link>
            <Link to="/help" className="hover:text-ink-800">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function StoreLayout() {
  const [mobileNav, setMobileNav] = useState(false)
  const count = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0))
  const wishCount = useWishlistStore((s) => s.ids.length)
  const location = useLocation()

  useEffect(() => {
    setMobileNav(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname, location.search])

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />

      <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5">
          <button
            onClick={() => setMobileNav(true)}
            className="flex size-10 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <Logo className="shrink-0" />

          <div className="hidden flex-1 lg:block">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <Link
              to="/account/wishlist"
              className="relative flex size-10 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
              aria-label="Wishlist"
            >
              <Heart className="size-5" />
              {wishCount > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-ink-900 text-[9px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:block">
              <AccountMenu />
            </div>

            <Link
              to="/cart"
              className="relative flex size-10 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="border-t border-ink-100">
          <div className="mx-auto hidden h-11 max-w-7xl items-center gap-1 px-4 lg:flex">
            <Link
              to="/shop?deals=1"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Sparkles className="size-4" /> Deals
            </Link>
            {categories.map((c) => (
              <NavLink
                key={c.id}
                to={`/shop?category=${c.slug}`}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                    location.search.includes(`category=${c.slug}`)
                      ? 'bg-ink-100 text-ink-900'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                    isActive && 'text-ink-900',
                  )
                }
              >
                {c.name}
              </NavLink>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-[13px] text-ink-500">
              <MapPin className="size-3.5" /> Shipping to <span className="font-semibold text-ink-700">United States</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {mobileNav && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileNav(false)} />
          <aside className="animate-scale-in absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileNav(false)} aria-label="Close menu">
                <X className="size-5" />
              </Button>
            </div>
            <div className="border-b border-ink-100 p-4">
              <SearchBox onNavigate={() => setMobileNav(false)} />
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <Link
                to="/shop?deals=1"
                className="mb-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700"
              >
                <Sparkles className="size-4" /> Today's deals
              </Link>
              <p className="px-2 py-3 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">Shop by category</p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/shop?category=${c.slug}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
                        <CategoryIcon categoryId={c.id} className="size-4.5" />
                      </span>
                      {c.name}
                      <ChevronRight className="ml-auto size-4 text-ink-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-ink-100 p-4">
              <AccountMenu />
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export function CartSummaryBar() {
  const count = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0))
  const totals = useCartStore((s) => s.totals)()
  if (!count) return null
  return (
    <div className="border-t border-ink-200 bg-white p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-500">
          {count} item{count === 1 ? '' : 's'}
        </span>
        <span className="font-semibold text-ink-900">{money(totals.total)}</span>
      </div>
      <Link
        to="/checkout"
        className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-ink-900 text-sm font-semibold text-white"
      >
        Checkout
      </Link>
      <Badge className="mt-2">Shipping calculated at checkout</Badge>
    </div>
  )
}
