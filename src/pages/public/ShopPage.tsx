import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, LayoutGrid, Rows3, Check, Tag, PackageSearch } from 'lucide-react'
import { categories, products as allProducts } from '@/data/catalog'
import { listProducts } from '@/api/products'
import type { SortKey, ProductFacets } from '@/api/products'
import type { Product } from '@/lib/types'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge, Button, Checkbox, EmptyState, Pagination, ProductCardSkeleton, Rating, Select } from '@/components/ui'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductImage } from '@/components/product/ProductImage'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { toast } from '@/store/toastStore'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'bestselling', label: 'Best selling' },
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Alphabetical' },
]

const PRICE_STOPS = [0, 100, 250, 500, 1000, 2500]

const CATEGORY_COUNTS = allProducts.reduce<Record<string, number>>((acc, p) => {
  if (p.status === 'active') acc[p.categoryId] = (acc[p.categoryId] ?? 0) + 1
  return acc
}, {})

type PageData = {
  items: Product[]
  total: number
  page: number
  pages: number
  facets: ProductFacets
}

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [drawer, setDrawer] = useState(false)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)

  const paramString = params.toString()
  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const deals = params.get('deals') === '1'
  const sort = (params.get('sort') as SortKey) ?? 'featured'
  const page = Number(params.get('page') ?? 1)
  const rating = Number(params.get('rating') ?? 0)
  const maxPrice = Number(params.get('max') ?? 0)
  const brands = params.getAll('brand')
  const tags = params.getAll('tag')

  const patch = (next: Record<string, string | number | null>) => {
    const sp = new URLSearchParams(paramString)
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '' || v === 0) sp.delete(k)
      else sp.set(k, String(v))
    }
    if (!('page' in next)) sp.delete('page')
    setParams(sp)
  }

  const toggleMulti = (key: 'brand' | 'tag', value: string) => {
    const current = params.getAll(key)
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value]
    const sp = new URLSearchParams(paramString)
    sp.delete(key)
    next.forEach((v) => sp.append(key, v))
    sp.delete('page')
    setParams(sp)
  }

  const query = useMemo(
    () => ({
      q,
      category,
      brands,
      tags,
      sale: deals,
      rating: rating || undefined,
      max: maxPrice || undefined,
      sort,
      page,
      perPage: 12,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramString],
  )

  useEffect(() => {
    let alive = true
    setLoading(true)
    listProducts(query)
      .then((r) => {
        if (!alive) return
        setData(r)
        setLoading(false)
      })
      .catch(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramString])

  const activeCategory = categories.find((c) => c.slug === category)
  const activeFilters = brands.length + tags.length + (rating ? 1 : 0) + (maxPrice ? 1 : 0) + (deals ? 1 : 0)

  const clearAll = () => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    setParams(sp)
  }

  const filterPanel = (
    <div className="space-y-7">
      <section>
        <h3 className="mb-3 text-[11px] font-bold tracking-widest text-ink-400 uppercase">Category</h3>
        <div className="space-y-1">
          <FilterRow
            active={!category}
            label="All products"
            count={Object.values(CATEGORY_COUNTS).reduce((a, b) => a + b, 0)}
            onClick={() => patch({ category: null, page: 1 })}
          />
          {categories.map((c) => (
            <FilterRow
              key={c.id}
              active={category === c.slug}
              label={c.name}
              count={CATEGORY_COUNTS[c.id] ?? 0}
              onClick={() => patch({ category: category === c.slug ? null : c.slug, page: 1 })}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-bold tracking-widest text-ink-400 uppercase">Price</h3>
        <div className="space-y-1">
          {PRICE_STOPS.map((stop) => (
            <FilterRow
              key={stop}
              active={(maxPrice || 0) === stop}
              label={stop === 0 ? 'Any price' : stop >= 2500 ? 'RWF 2,500 and up' : `Under ${money(stop)}`}
              onClick={() => patch({ max: stop === 0 ? null : stop, page: 1 })}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-bold tracking-widest text-ink-400 uppercase">Rating</h3>
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => patch({ rating: rating === r ? null : r, page: 1 })}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition',
                rating === r ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              <Rating value={r} showValue={false} />
              <span className="text-xs">& up</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-bold tracking-widest text-ink-400 uppercase">Brand</h3>
        <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
          {(data?.facets.brands ?? []).map((b) => (
            <Checkbox
              key={b.name}
              checked={brands.includes(b.name)}
              onChange={() => toggleMulti('brand', b.name)}
              label={
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{b.name}</span>
                  <span className="text-xs text-ink-400">{b.count}</span>
                </span>
              }
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-bold tracking-widest text-ink-400 uppercase">Availability</h3>
        <div className="space-y-2.5">
          <Checkbox
            checked={deals}
            onChange={() => patch({ deals: deals ? null : '1', page: 1 })}
            label={
              <span className="flex items-center gap-2">
                <Tag className="size-3.5 text-red-500" /> On sale only
              </span>
            }
          />
        </div>
      </section>

      {activeFilters > 0 && (
        <Button variant="outline" full onClick={clearAll}>
          Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 flex items-center gap-2 text-[13px] text-ink-500">
        <Link to="/" className="hover:text-ink-800">Home</Link>
        <span>/</span>
        <span className="font-medium text-ink-800">{activeCategory?.name ?? 'All products'}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {q ? `Results for “${q}”` : (activeCategory?.name ?? 'All products')}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {activeCategory?.tagline ?? 'Everything we sell, in one place.'}{' '}
            {data && <span className="font-semibold text-ink-700">{data.total} products</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="lg:hidden"
            icon={<SlidersHorizontal className="size-4" />}
            onClick={() => setDrawer(true)}
          >
            Filters {activeFilters > 0 && `(${activeFilters})`}
          </Button>
          <div className="hidden items-center rounded-xl border border-ink-200 p-1 sm:flex">
            <ViewToggle active={view === 'grid'} onClick={() => setView('grid')} icon={<LayoutGrid className="size-4" />} label="Grid view" />
            <ViewToggle active={view === 'list'} onClick={() => setView('list')} icon={<Rows3 className="size-4" />} label="List view" />
          </div>
          <Select value={sort} onChange={(e) => patch({ sort: e.target.value, page: 1 })} className="w-44">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {category && activeCategory && (
            <FilterChip label={activeCategory.name} onClear={() => patch({ category: null, page: 1 })} />
          )}
          {deals && <FilterChip label="On sale" tone="red" onClear={() => patch({ deals: null, page: 1 })} />}
          {maxPrice ? <FilterChip label={`Under ${money(maxPrice)}`} onClear={() => patch({ max: null, page: 1 })} /> : null}
          {rating ? <FilterChip label={`${rating} stars & up`} onClear={() => patch({ rating: null, page: 1 })} /> : null}
          {brands.map((b) => (
            <FilterChip key={b} label={b} onClear={() => toggleMulti('brand', b)} />
          ))}
          {tags.map((t) => (
            <FilterChip key={t} label={t} onClear={() => toggleMulti('tag', t)} />
          ))}
          <button onClick={clearAll} className="text-xs font-semibold text-ink-500 underline hover:text-ink-800">
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-40 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">{filterPanel}</div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-6" />}
              title="No products match those filters"
              description="Try widening the price range or removing a brand filter."
              action={<Button onClick={clearAll}>Reset filters</Button>}
            />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {data.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </div>
          )}

          {data && data.total > 0 && (
            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              onChange={(p) => {
                patch({ page: p })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white">
            <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
              <h2 className="text-base font-semibold text-ink-900">Filters</h2>
              <button onClick={() => setDrawer(false)} aria-label="Close filters">
                <X className="size-5 text-ink-500" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
            <footer className="border-t border-ink-100 p-4">
              <Button full onClick={() => setDrawer(false)}>
                Show {data?.total ?? 0} results
              </Button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'rounded-lg p-1.5 transition',
        active ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-100',
      )}
    >
      {icon}
    </button>
  )
}

function FilterRow({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition',
        active ? 'bg-ink-900 font-medium text-white' : 'text-ink-600 hover:bg-ink-100',
      )}
    >
      {label}
      {count != null && <span className={cn('text-xs', active ? 'text-white/60' : 'text-ink-400')}>{count}</span>}
    </button>
  )
}

function FilterChip({ label, onClear, tone = 'default' }: { label: string; onClear: () => void; tone?: 'default' | 'red' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
        tone === 'red' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-white text-ink-700 ring-ink-200',
      )}
    >
      {label}
      <button onClick={onClear} className="opacity-60 transition hover:opacity-100" aria-label={`Remove ${label}`}>
        <X className="size-3" />
      </button>
    </span>
  )
}

function ProductRow({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add)
  const toggleWish = useWishlistStore((s) => s.toggle)
  const wished = useWishlistStore((s) => s.ids.includes(product.id))
  const pct = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-ink-200 bg-white p-4 sm:flex-row">
      <Link to={`/product/${product.slug}`} className="shrink-0 sm:w-56">
        <ProductImage product={product} className="aspect-4/3 w-full rounded-xl" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">{product.brand}</p>
            <h3 className="mt-1 text-base font-semibold text-ink-900">
              <Link to={`/product/${product.slug}`} className="hover:text-brand-700">
                {product.name}
              </Link>
            </h3>
          </div>
          {pct > 0 && <Badge tone="red">-{pct}%</Badge>}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-ink-600">{product.tagline}</p>
        <ul className="mt-3 hidden gap-x-6 gap-y-1 sm:block">
          {product.highlights.slice(0, 3).map((h) => (
            <li key={h} className="flex items-center gap-1.5 text-xs text-ink-500">
              <Check className="size-3.5 text-emerald-500" /> {h}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-ink-900">{money(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-ink-400 line-through">{money(product.compareAtPrice)}</span>
            )}
          </div>
          <Rating value={product.rating} />
          <span className="text-xs text-ink-400">{product.reviewCount} reviews</span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toggleWish(product.id)
                toast.info(wished ? 'Removed from wishlist' : 'Saved to wishlist', product.name)
              }}
            >
              {wished ? 'Saved' : 'Save'}
            </Button>
            <Button
              size="sm"
              disabled={product.stock === 0}
              onClick={() => {
                add(product.id, product.colors[0] ?? '#111827')
                toast.success('Added to bag', product.name)
              }}
            >
              Add to bag
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
