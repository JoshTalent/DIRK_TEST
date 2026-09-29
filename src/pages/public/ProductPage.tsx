import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Share2,
  Copy,
  ChevronRight,
  Package,
  MessageSquare,
  ThumbsUp,
  Minus,
  Plus,
} from 'lucide-react'
import { getProductBySlug, getRelated, getReviewsFor, submitReview } from '@/api/products'
import type { Product, Review } from '@/lib/types'
import { categories } from '@/data/catalog'
import { money, timeAgo, copyToClipboard } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  ProductCardSkeleton,
  Rating,
  Tabs,
  Textarea,
  Field,
  Select,
} from '@/components/ui'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductImage } from '@/components/product/ProductImage'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'

type TabKey = 'overview' | 'specs' | 'reviews'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [related, setRelated] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [color, setColor] = useState('')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<TabKey>('overview')
  const [writeOpen, setWriteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const add = useCartStore((s) => s.add)
  const cartAdd = useCartStore((s) => s.add)
  const toggleWish = useWishlistStore((s) => s.toggle)
  const wished = useWishlistStore((s) => (product ? s.ids.includes(product.id) : false))
  const view = useWishlistStore((s) => s.view)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    let alive = true
    setProduct(null)
    setNotFound(false)
    setQty(1)
    setTab('overview')
    setLoadingReviews(true)

    getProductBySlug(slug)
      .then(async (p) => {
        if (!p) {
          if (alive) setNotFound(true)
          return
        }
        const [rel, revs] = await Promise.all([getRelated(p.id, 4), getReviewsFor(p.id)])
        if (!alive) return
        setProduct(p)
        setColor(p.colors[0] ?? '#111827')
        setRelated(rel)
        setReviews(revs)
        setLoadingReviews(false)
        view(p.id)
      })
      .catch(() => alive && setNotFound(true))

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const breakdown = useMemo(() => {
    const map = new Map<number, number>()
    reviews.forEach((r) => map.set(r.rating, (map.get(r.rating) ?? 0) + 1))
    const total = reviews.length || 1
    return [
      { label: '5 star', pct: ((map.get(5) ?? 0) / total) * 100 },
      { label: '4 star', pct: ((map.get(4) ?? 0) / total) * 100 },
      { label: '3 star', pct: ((map.get(3) ?? 0) / total) * 100 },
      { label: '1–2 star', pct: (((map.get(1) ?? 0) + (map.get(2) ?? 0)) / total) * 100 },
    ]
  }, [reviews])

  if (notFound) {
    return (
      <EmptyState
        className="min-h-[60vh]"
        icon={<Package className="size-6" />}
        title="We could not find that product"
        description="It may have been renamed or retired."
        action={<Button onClick={() => navigate('/shop')}>Browse the catalogue</Button>}
      />
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="skeleton aspect-square rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-9 w-3/4 rounded" />
            <div className="skeleton h-5 w-32 rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const category = categories.find((c) => c.id === product.categoryId)
  const pct = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0
  const soldOut = product.stock === 0
  const lowStock = product.stock > 0 && product.stock <= 8
  const eta = new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const handleAdd = () => {
    add(product.id, color, qty)
    toast.success('Added to bag', `${qty} × ${product.name}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-500">
        <Link to="/" className="hover:text-ink-800">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link to={`/shop?category=${category?.slug}`} className="hover:text-ink-800">{category?.name}</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-ink-800">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-ink-200 bg-white">
            <ProductImage product={product} selectedColor={color} className="aspect-square w-full" iconSize="xl" />
            <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
              {pct > 0 && <Badge tone="red">Save {pct}%</Badge>}
              {product.featured && <Badge tone="brand">Editor's pick</Badge>}
            </div>
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  toggleWish(product.id)
                  toast.info(wished ? 'Removed from wishlist' : 'Saved to wishlist', product.name)
                }}
                className="flex size-10 items-center justify-center rounded-xl bg-white/90 text-ink-600 backdrop-blur transition hover:text-red-500"
                aria-label="Save to wishlist"
              >
                <Heart className={cn('size-4.5', wished && 'fill-red-500 text-red-500')} />
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex size-10 items-center justify-center rounded-xl bg-white/90 text-ink-600 backdrop-blur transition hover:text-ink-900"
                aria-label="Share"
              >
                <Share2 className="size-4.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.colors.slice(0, 4).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'overflow-hidden rounded-2xl border-2 transition',
                  color === c ? 'border-ink-900' : 'border-ink-200 hover:border-ink-300',
                )}
                aria-label={`View ${c}`}
              >
                <ProductImage product={product} selectedColor={c} className="aspect-square w-full" iconSize="md" />
              </button>
            ))}
          </div>
        </div>

        {/* Buy box */}
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-ink-400 uppercase">{product.brand}</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink-900">{product.name}</h1>
          <p className="mt-2 text-ink-600">{product.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link to="#reviews" className="flex items-center gap-2">
              <Rating value={product.rating} />
              <span className="text-sm text-ink-500 underline">{product.reviewCount} reviews</span>
            </Link>
            <span className="text-sm text-ink-400">{product.sold.toLocaleString()} sold</span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-ink-900">{money(product.price)}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-xl text-ink-400 line-through">{money(product.compareAtPrice)}</span>
                <Badge tone="green">You save {money(product.compareAtPrice - product.price)}</Badge>
              </>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-500">or 4 interest-free payments of {money(product.price / 4)}</p>

          {product.colors.length > 0 && (
            <div className="mt-7">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink-800">Finish</p>
                <span className="text-[13px] text-ink-500">{product.colors.length} options</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Select colour ${c}`}
                    className={cn(
                      'size-9 rounded-full ring-offset-2 transition',
                      color === c ? 'ring-2 ring-ink-900' : 'ring-1 ring-ink-200 hover:ring-ink-400',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="inline-flex h-12 items-center rounded-xl border border-ink-200">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-full w-11 items-center justify-center text-ink-600 hover:bg-ink-50" aria-label="Decrease">
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="flex h-full w-11 items-center justify-center text-ink-600 hover:bg-ink-50" aria-label="Increase">
                <Plus className="size-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1" disabled={soldOut} onClick={handleAdd} icon={<ShoppingBag className="size-4.5" />}>
              {soldOut ? 'Out of stock' : 'Add to bag'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                cartAdd(product.id, color, qty)
                toast.success('Added to bag', product.name)
              }}
            >
              Buy now
            </Button>
          </div>

          <div className="mt-3">
            {soldOut ? (
              <p className="text-sm font-medium text-red-600">Currently out of stock — check back in 2–3 weeks.</p>
            ) : lowStock ? (
              <p className="text-sm text-amber-700">
                Only <span className="font-semibold">{product.stock} left</span> in stock — {Math.min(product.stock * 2, 60)} people are viewing this.
              </p>
            ) : (
              <p className="text-sm text-emerald-700">
                <Check className="mr-1 inline size-4" /> In stock — {product.stock} units ready to ship
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-ink-200 bg-white p-4 sm:grid-cols-3">
            {[
              { icon: Truck, title: 'Free express', sub: `Arrives by ${eta}` },
              { icon: RotateCcw, title: '30-day returns', sub: 'Prepaid label' },
              { icon: ShieldCheck, title: '2-year warranty', sub: 'Included' },
            ].map((i) => (
              <div key={i.title} className="flex items-start gap-2.5">
                <i.icon className="mt-0.5 size-4.5 shrink-0 text-ink-400" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink-800">{i.title}</p>
                  <p className="truncate text-xs text-ink-500">{i.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-6 space-y-2.5">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-ink-700">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                {h}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-ink-400">
            SKU {product.sku} · Added {timeAgo(product.createdAt)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16" id="reviews">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'specs', label: 'Specifications' },
            { value: 'reviews', label: 'Reviews', count: product.reviewCount },
          ]}
        />

        {tab === 'overview' && (
          <div className="grid gap-8 py-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-ink-900">About this product</h3>
              <p className="mt-3 leading-relaxed text-ink-600">{product.description}</p>
              <h4 className="mt-8 text-base font-semibold text-ink-900">Why we stock it</h4>
              <p className="mt-2 leading-relaxed text-ink-600">
                We only list products that have survived our own two-year soak test. {product.brand} is one of a handful
                of makers whose failure rate sits below 1%, which is why {product.name} carries the full warranty rather
                than a 12-month compromise.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Truck, title: 'Dispatched in 24h', sub: 'From our Ohio warehouse' },
                  { icon: ShieldCheck, title: '30-day trial', sub: 'Live with it before deciding' },
                  { icon: MessageSquare, title: 'Real support', sub: 'Humans, 7 days a week' },
                ].map((f) => (
                  <Card key={f.title} className="p-4">
                    <f.icon className="size-5 text-brand-600" />
                    <p className="mt-3 text-sm font-semibold text-ink-900">{f.title}</p>
                    <p className="mt-1 text-[13px] text-ink-500">{f.sub}</p>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="h-fit p-5">
              <h4 className="text-[13px] font-semibold tracking-wide text-ink-900 uppercase">Key specs</h4>
              <dl className="mt-4 space-y-3">
                {product.specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 border-b border-ink-100 pb-2.5 last:border-0">
                    <dt className="text-[13px] text-ink-500">{s.label}</dt>
                    <dd className="text-right text-[13px] font-medium text-ink-800">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        )}

        {tab === 'specs' && (
          <div className="py-8">
            <Card className="max-w-3xl overflow-hidden">
              <table className="w-full text-left">
                <tbody className="divide-y divide-ink-100">
                  {product.specs.map((s) => (
                    <tr key={s.label} className="hover:bg-ink-50/60">
                      <th className="w-1/3 px-5 py-3.5 text-[13px] font-medium text-ink-500">{s.label}</th>
                      <td className="px-5 py-3.5 text-sm text-ink-800">{s.value}</td>
                    </tr>
                  ))}
                  <tr className="hover:bg-ink-50/60">
                    <th className="px-5 py-3.5 text-[13px] font-medium text-ink-500">SKU</th>
                    <td className="px-5 py-3.5 font-mono text-sm text-ink-800">{product.sku}</td>
                  </tr>
                  <tr className="hover:bg-ink-50/60">
                    <th className="px-5 py-3.5 text-[13px] font-medium text-ink-500">Tags</th>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {product.tags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="grid gap-10 py-8 lg:grid-cols-[300px_1fr]">
            <div>
              <Card className="p-5">
                <div className="text-center">
                  <p className="text-5xl font-extrabold text-ink-900">{product.rating.toFixed(1)}</p>
                  <Rating value={product.rating} className="mt-2 justify-center" showValue={false} />
                  <p className="mt-2 text-[13px] text-ink-500">Based on {product.reviewCount} reviews</p>
                </div>
                <div className="mt-5 space-y-2">
                  {breakdown.map((b) => (
                    <div key={b.label} className="flex items-center gap-3 text-xs">
                      <span className="w-14 text-ink-500">{b.label}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <span className="block h-full rounded-full bg-ink-900" style={{ width: `${b.pct}%` }} />
                      </span>
                      <span className="w-9 text-right tabular-nums text-ink-500">{Math.round(b.pct)}%</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-5"
                  full
                  onClick={() =>
                    user
                      ? setWriteOpen(true)
                      : navigate(`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`)
                  }
                >
                  Write a review
                </Button>
                {!user && <p className="mt-2 text-center text-xs text-ink-400">Sign in to share your experience</p>}
              </Card>
            </div>

            <div>
              {loadingReviews ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-32 rounded-2xl" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <EmptyState title="No published reviews yet" description="Be the first to tell other buyers what you think." />
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li key={r.id}>
                      <Card className="p-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                            {r.userName[0]}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{r.userName}</p>
                            <p className="text-xs text-ink-400">{timeAgo(r.createdAt)}</p>
                          </div>
                          {r.verified && (
                            <Badge tone="green" className="ml-auto">
                              <Check className="size-3" /> Verified purchase
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Rating value={r.rating} showValue={false} />
                          <p className="text-sm font-semibold text-ink-900">{r.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600">{r.body}</p>
                        <div className="mt-4 flex items-center gap-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
                          <button className="flex items-center gap-1.5 transition hover:text-ink-800">
                            <ThumbsUp className="size-3.5" /> Helpful ({r.helpful})
                          </button>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight text-ink-900">You might also consider</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <Modal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        title={`Review ${product.name}`}
        description="Your review will appear once a moderator approves it — usually within a few hours."
      >
        <WriteReviewForm
          product={product}
          onDone={() => {
            setWriteOpen(false)
            toast.success('Thanks — your review is in the queue', 'We will email you once it is published.')
          }}
        />
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share this product" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-ink-600">Copy the link and send it to whoever will actually use it.</p>
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 p-2 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-600">{window.location.href}</span>
            <Button
              size="sm"
              icon={<Copy className="size-3.5" />}
              onClick={() => {
                copyToClipboard(window.location.href)
                toast.success('Link copied')
              }}
            >
              Copy
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {['Email', 'WhatsApp', 'X'].map((s) => (
              <Button key={s} variant="outline" size="sm" full>
                {s}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function WriteReviewForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const user = useAuthStore((s) => s.user)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!user) return
    setSaving(true)
    await submitReview({
      productId: product.id,
      userId: user.id,
      userName: user.name,
      rating,
      title: title || 'My experience',
      body,
    })
    setSaving(false)
    onDone()
  }

  return (
    <div className="space-y-4">
      <Field label="Your rating" required>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={cn(
                'size-11 rounded-xl border text-sm font-semibold transition',
                rating >= n
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-ink-200 text-ink-400 hover:border-ink-300',
              )}
            >
              {n}★
            </button>
          ))}
        </div>
      </Field>
      <Field label="Headline" hint="Summarise your experience in a few words">
        <Select value={title} onChange={(e) => setTitle(e.target.value)}>
          <option value="">Choose a headline…</option>
          <option>Exactly what I hoped for</option>
          <option>Worth every cent</option>
          <option>Good, with one caveat</option>
          <option>Not for me</option>
        </Select>
      </Field>
      <Field label="Your review" required>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you use it for? How did it hold up? What would you tell a friend?"
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button loading={saving} disabled={!body.trim()} onClick={submit}>
          Submit for review
        </Button>
      </div>
    </div>
  )
}

