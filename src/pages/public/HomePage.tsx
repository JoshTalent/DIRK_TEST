import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Star,
  Quote,
  Truck,
  CreditCard,
  RefreshCw,
  Headphones,
} from 'lucide-react'
import { categories } from '@/data/catalog'
import { getDeals, getFeatured, getNewArrivals, listProducts } from '@/api/products'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/cn'
import { Badge, Button, ButtonLink, ProductCardSkeleton, Rating, Skeleton } from '@/components/ui'
import { ProductCard } from '@/components/product/ProductCard'
import { CategoryIcon } from '@/components/product/ProductImage'

function useProducts(loader: () => Promise<Product[]>, deps: unknown[] = []) {
  const [items, setItems] = useState<Product[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    setItems(null)
    loader()
      .then((r) => alive && setItems(r))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { items, error }
}

function ProductRail({
  title,
  subtitle,
  products,
  loading,
  href,
  tone = 'light',
}: {
  title: string
  subtitle?: string
  products: Product[] | null
  loading: boolean
  href: string
  tone?: 'light' | 'dark'
}) {
  return (
    <section className={cn('mx-auto max-w-7xl px-4 py-12', tone === 'dark' && 'rounded-3xl bg-ink-950 px-6 sm:px-8')}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className={cn('text-2xl font-bold tracking-tight', tone === 'dark' ? 'text-white' : 'text-ink-900')}>
            {title}
          </h2>
          {subtitle && <p className={cn('mt-1 text-sm', tone === 'dark' ? 'text-ink-400' : 'text-ink-500')}>{subtitle}</p>}
        </div>
        <Link
          to={href}
          className={cn(
            'hidden items-center gap-1.5 text-sm font-semibold transition sm:flex',
            tone === 'dark' ? 'text-white hover:text-brand-300' : 'text-ink-700 hover:text-brand-700',
          )}
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : (products ?? []).slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="mt-6 sm:hidden">
        <ButtonLink to={href} variant="outline" full>
          View all <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    </section>
  )
}

const TESTIMONIALS = [
  {
    quote:
      'I have bought from four “premium” brands in two years. The Meridian is the first watch I have owned that I never think about taking off.',
    name: 'Priya Raghunathan',
    role: 'Software engineer, Austin',
    product: 'Meridian Smartwatch S3',
    rating: 5,
  },
  {
    quote:
      'Ordered on Tuesday, arrived Wednesday morning. The packaging alone told me I had made the right call — then the build quality confirmed it.',
    name: 'Daniel Okonkwo',
    role: 'Architect, Chicago',
    product: 'Vertex 14 Ultrabook',
    rating: 5,
  },
  {
    quote:
      'Support replaced a faulty cable in 36 hours with no argument. That is the reason I keep coming back rather than the price.',
    name: 'Sofia Marchetti',
    role: 'Photographer, Portland',
    product: 'Steady Gimbal 3',
    rating: 4,
  },
]

export default function HomePage() {
  const featured = useProducts(() => getFeatured(8))
  const deals = useProducts(() => getDeals(8))
  const fresh = useProducts(() => getNewArrivals(8))
  const [topRated, setTopRated] = useState<Product[] | null>(null)
  const [heroSlide, setHeroSlide] = useState(0)

  useEffect(() => {
    listProducts({ sort: 'rating', perPage: 4 }).then((r) => setTopRated(r.items))
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => setHeroSlide((v) => (v + 1) % 3), 6500)
    return () => window.clearInterval(t)
  }, [])

  const heroes = [
    {
      eyebrow: 'New season',
      title: 'Sound that disappears into the room',
      body: 'The Halo Studio pair adds adaptive noise cancelling, 52-hour battery life and lossless USB-C audio. Now RWF 349, down from RWF 429.',
      cta: { to: '/shop?category=audio', label: 'Shop audio' },
      secondary: { to: '/product/aurora-tech-slice-11-tablet', label: 'See the Slate 11' },
      tint: 'from-brand-600 to-brand-800',
      categoryId: 'c-audio',
    },
    {
      eyebrow: 'Up to 40% off',
      title: 'Built for the desk you actually have',
      body: 'Mechanical keyboards, 4K monitors and the 65% Orbit. Twelve months of interest-free credit on everything over RWF 300.',
      cta: { to: '/shop?category=computing', label: 'Shop computing' },
      secondary: { to: '/shop?deals=1', label: 'View all deals' },
      tint: 'from-ink-900 to-ink-950',
      categoryId: 'c-compute',
    },
    {
      eyebrow: 'Free 2-year warranty',
      title: 'Gear you will not have to replace',
      body: 'Every product is tested in-house for two years before launch. If it fails, we fix it — no receipt archaeology, no forms.',
      cta: { to: '/shop', label: 'Browse everything' },
      secondary: { to: '/about', label: 'How we test' },
      tint: 'from-emerald-700 to-teal-900',
      categoryId: 'c-camera',
    },
  ]

  const hero = heroes[heroSlide]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className={cn('absolute inset-0 bg-gradient-to-br transition-all duration-700', hero.tint)} />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div key={heroSlide} className="animate-fade-up">
            <Badge className="bg-white/15 text-white ring-white/25">
              <span className="size-1.5 rounded-full bg-white" /> {hero.eyebrow}
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">{hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to={hero.cta.to} size="lg" className="bg-white! text-ink-900! hover:bg-ink-100!">
                {hero.cta.label}
              </ButtonLink>
              <ButtonLink
                to={hero.secondary.to}
                size="lg"
                variant="outline"
                className="border-white/30! bg-white/10! text-white! hover:bg-white/20!"
              >
                {hero.secondary.label}
              </ButtonLink>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-white/70">
              <span className="flex items-center gap-2 text-[13px]">
                <Truck className="size-4" /> Free shipping over RWF 99
              </span>
              <span className="flex items-center gap-2 text-[13px]">
                <RefreshCw className="size-4" /> 30-day returns
              </span>
              <span className="flex items-center gap-2 text-[13px]">
                <Headphones className="size-4" /> Support 7 days a week
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <CategoryIcon categoryId={hero.categoryId} className="absolute top-1/2 left-1/2 size-1/2 -translate-x-1/2 -translate-y-1/2 text-white/25" strokeWidth={1} />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-ink-950/80 to-transparent p-6">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Featured</p>
                  <p className="text-white">Halo Studio Over-Ear Headphones</p>
                </div>
                <span className="ml-auto text-lg font-bold text-white">RWF 349</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center gap-2 px-4 pb-8">
          {heroes.map((h, i) => (
            <button
              key={h.title}
              onClick={() => setHeroSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === heroSlide ? 'w-10 bg-white' : 'w-4 bg-white/30 hover:bg-white/50',
              )}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">Shop by category</h2>
            <p className="mt-1 text-sm text-ink-500">Eight departments, 64 products, one checkout.</p>
          </div>
          <Link to="/shop" className="hidden items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-brand-700 sm:flex">
            All products <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lg hover:shadow-ink-200/60"
            >
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-ink-100 text-ink-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <CategoryIcon categoryId={c.id} className="size-5" />
              </span>
              <p className="text-sm font-semibold text-ink-900">{c.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{c.tagline}</p>
              <ArrowRight className="mt-3 size-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      </section>

      <ProductRail
        title="Featured this week"
        subtitle="Hand-picked by the buying team"
        products={featured.items}
        loading={featured.items === null}
        href="/shop?sort=featured"
      />

      {/* Deals band */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="overflow-hidden rounded-3xl bg-ink-950 px-6 py-10 sm:px-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="bg-red-500/15 text-red-300 ring-red-500/30">Ends Sunday</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Today's deals</h2>
              <p className="mt-1 text-sm text-ink-400">Real markdown, not inflated “was” prices.</p>
            </div>
            <ButtonLink to="/shop?deals=1" variant="outline" className="border-white/25! bg-white/10! text-white! hover:bg-white/20!">
              Shop all deals <ArrowRight className="size-4" />
            </ButtonLink>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {deals.items === null
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : (deals.items ?? []).slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-3">
          {[
            {
              icon: Truck,
              title: 'Free express delivery',
              body: 'On every order over RWF 99, dispatched within 24 hours from our Ohio warehouse. Tracked from door to door.',
            },
            {
              icon: CreditCard,
              title: 'Pay how you want',
              body: 'Cards, Apple Pay, PayPal, bank transfer or cash on delivery. Nothing extra at checkout, ever.',
            },
            {
              icon: RefreshCw,
              title: 'Returns that are actually easy',
              body: '30 days, prepaid label in the box, refunded within 2 business days of arrival back at our door.',
            },
          ].map((v) => (
            <div key={v.title}>
              <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <v.icon className="size-6" />
              </span>
              <h3 className="text-lg font-semibold text-ink-900">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ProductRail
        title="New arrivals"
        subtitle="Just landed, already reviewed"
        products={fresh.items}
        loading={fresh.items === null}
        href="/shop?sort=newest"
      />

      {/* Top rated */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">Highest rated this month</h2>
          <p className="mt-1 text-sm text-ink-500">Ranked by verified buyers, not by margin.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topRated === null
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
            : topRated.map((p, i) => (
                <div key={p.id} className="group relative">
                  <span className="absolute top-3 left-3 z-10 flex size-8 items-center justify-center rounded-full bg-ink-950 text-sm font-bold text-white shadow-lg">
                    {i + 1}
                  </span>
                  <ProductCard product={p} />
                </div>
              ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Loved by people who keep things</h2>
            <p className="mt-3 text-ink-500">4.8 average across 21,400 verified reviews.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl border border-ink-200 bg-ink-50/50 p-6">
                <Quote className="size-6 text-ink-300" />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-700">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-200 pt-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                    {t.name[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{t.name}</p>
                    <p className="truncate text-xs text-ink-500">{t.role}</p>
                  </div>
                  <Rating value={t.rating} showValue={false} className="ml-auto" />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-3xl bg-brand-600 px-6 py-12 text-center sm:px-12">
          <Star className="mx-auto size-8 text-white/70" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Get 15% off your first order</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-100">
            One email a month: new drops, restocks and the occasional honest note about what we got wrong.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="h-12 flex-1 rounded-xl border-0 bg-white/15 px-4 text-sm text-white placeholder:text-white/60 focus:bg-white/25 focus:outline-none"
            />
            <Button size="lg" className="bg-ink-950! text-white! hover:bg-ink-900!">
              Subscribe
            </Button>
          </form>
          <p className="mt-3 text-xs text-brand-200">No spam. Unsubscribe in one click.</p>
        </div>
      </section>
    </div>
  )
}

export { useProducts, ProductRail }
