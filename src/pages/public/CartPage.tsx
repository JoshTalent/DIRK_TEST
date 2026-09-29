import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Trash2, Tag, ArrowRight, Truck, ShieldCheck, X, Sparkles } from 'lucide-react'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'
import { products as allProducts } from '@/data/catalog'
import { FREE_SHIPPING_THRESHOLD } from '@/api/orders'
import { Badge, Button, EmptyState, Input, Progress, QuantityStepper } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { useCartStore } from '@/store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const lines = useCartStore((s) => s.lines)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)
  const coupon = useCartStore((s) => s.coupon)
  const applyCoupon = useCartStore((s) => s.applyCoupon)
  const removeCoupon = useCartStore((s) => s.removeCoupon)
  const totals = useCartStore((s) => s.totals)()
  const [code, setCode] = useState('')
  const [couponMsg, setCouponMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  const productMap = new Map(allProducts.map((p) => [p.id, p]))
  const rows = lines
    .map((line) => ({ line, product: productMap.get(line.productId) }))
    .filter((r): r is { line: (typeof lines)[number]; product: (typeof allProducts)[number] } => Boolean(r.product))

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal)
  const hasStockIssue = rows.some((r) => r.line.qty > r.product.stock)

  if (!rows.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Your bag is empty"
          description="Once you add something it will stay here, even if you close the tab."
          action={
            <Button onClick={() => navigate('/shop')}>
              Start shopping <ArrowRight className="size-4" />
            </Button>
          }
        />
        <div className="mt-16">
          <h2 className="text-lg font-bold text-ink-900">Popular right now</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {allProducts
              .filter((p) => p.featured && p.status === 'active')
              .slice(0, 3)
              .map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 transition hover:border-ink-300">
                  <ProductImage product={p} className="size-12 shrink-0 rounded-lg" iconSize="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-800">{p.name}</p>
                    <p className="text-xs text-ink-500">{money(p.price)}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Shopping bag</h1>
          <p className="mt-1 text-sm text-ink-500">
            {rows.length} {rows.length === 1 ? 'line' : 'lines'} · {lines.reduce((s, l) => s + l.qty, 0)} items
          </p>
        </div>
        <button onClick={clear} className="text-sm font-medium text-ink-500 underline hover:text-ink-800">
          Clear bag
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <Progress value={(totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100} tone={remaining === 0 ? 'green' : 'brand'} />
            <p className="mt-2.5 text-[13px] text-ink-600">
              {remaining === 0 ? (
                <span className="font-semibold text-emerald-700">You have unlocked free express shipping.</span>
              ) : (
                <>
                  Spend <span className="font-semibold text-ink-900">{money(remaining)}</span> more for free express shipping.
                </>
              )}
            </p>
          </div>

          <ul className="mt-5 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            {rows.map(({ line, product }) => {
              const overStock = line.qty > product.stock
              return (
                <li key={`${line.productId}-${line.color}`} className="flex gap-4 p-4 sm:p-5">
                  <Link to={`/product/${product.slug}`} className="shrink-0">
                    <ProductImage product={product} selectedColor={line.color} className="size-24 rounded-xl sm:size-28" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">{product.brand}</p>
                        <h3 className="mt-0.5 truncate text-sm font-semibold text-ink-900">
                          <Link to={`/product/${product.slug}`} className="hover:text-brand-700">
                            {product.name}
                          </Link>
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                          <span className="size-2.5 rounded-full ring-1 ring-ink-900/10" style={{ backgroundColor: line.color }} />
                          Finish: {line.color}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(line.productId, line.color)}
                        className="shrink-0 text-ink-400 transition hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {overStock && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Only {product.stock} in stock — reduce the quantity to continue.
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <QuantityStepper
                        value={line.qty}
                        max={Math.max(1, product.stock)}
                        onChange={(v) => setQty(line.productId, line.color, v)}
                      />
                      <div className="text-right">
                        <p className="text-base font-bold text-ink-900">{money(product.price * line.qty)}</p>
                        {line.qty > 1 && (
                          <p className="text-xs text-ink-400">{money(product.price)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <Link to="/shop" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-brand-700">
            <ArrowRight className="size-4 rotate-180" /> Continue shopping
          </Link>
        </div>

        <aside className="lg:sticky lg:top-40 lg:h-fit">
          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-base font-semibold text-ink-900">Order summary</h2>

            <div className="mt-4 space-y-2.5 text-sm">
              <Row label="Subtotal" value={money(totals.subtotal)} />
              {totals.discount > 0 && <Row label="Discount" value={`− ${money(totals.discount)}`} tone="green" />}
              <Row
                label="Shipping"
                value={totals.shipping === 0 ? 'Free' : money(totals.shipping)}
                tone={totals.shipping === 0 ? 'green' : undefined}
              />
              <Row label="Estimated tax" value={money(totals.tax)} />
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-ink-200 pt-4">
              <span className="text-sm font-semibold text-ink-900">Total</span>
              <span className="text-2xl font-extrabold text-ink-900">{money(totals.total)}</span>
            </div>

            <Link
              to="/checkout"
              className={cn(
                'mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition',
                hasStockIssue ? 'pointer-events-none bg-ink-200 text-ink-400' : 'bg-ink-900 hover:bg-ink-800',
              )}
            >
              Proceed to checkout <ArrowRight className="size-4" />
            </Link>

            <div className="mt-5">
              {coupon ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200 ring-inset">
                  <Tag className="size-4 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-800">{coupon.code}</p>
                    <p className="truncate text-xs text-emerald-600">{coupon.description}</p>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-600 hover:text-emerald-900" aria-label="Remove coupon">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  <label className="text-[13px] font-medium text-ink-700">Promo code</label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="WELCOME15"
                      className="h-10"
                    />
                    <Button
                      variant="outline"
                      className="h-10 shrink-0"
                      onClick={() => {
                        const res = applyCoupon(code)
                        setCouponMsg({ tone: res.ok ? 'ok' : 'bad', text: res.message })
                        if (res.ok) setCode('')
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponMsg && (
                    <p className={cn('mt-2 text-xs font-medium', couponMsg.tone === 'ok' ? 'text-emerald-700' : 'text-red-600')}>
                      {couponMsg.text}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['WELCOME15', 'SAVE25', 'FREESHIP'].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          const res = applyCoupon(c)
                          setCouponMsg({ tone: res.ok ? 'ok' : 'bad', text: res.message })
                        }}
                        className="rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600 transition hover:bg-ink-200"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-xs text-ink-500">
              <p className="flex items-center gap-2">
                <Truck className="size-3.5" /> Dispatched within 24 hours
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5" /> 30-day returns, 2-year warranty
              </p>
              <p className="flex items-center gap-2">
                <Sparkles className="size-3.5" /> Secure checkout, no account required
              </p>
            </div>
          </div>

          <Badge tone="green" className="mt-4">
            Prices include VAT where applicable
          </Badge>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'green' }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={tone === 'green' ? 'font-medium text-emerald-600' : 'font-medium text-ink-900'}>{value}</span>
    </div>
  )
}

