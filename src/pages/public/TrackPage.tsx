import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PackageSearch, Truck, Package, MapPin, ArrowRight } from 'lucide-react'
import { getOrderByNumber } from '@/api/orders'
import type { Order } from '@/lib/types'
import { money, shortDate, dateTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, Input, OrderStatusBadge, PaymentStatusBadge, Spinner } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { products as allProducts } from '@/data/catalog'

export default function TrackPage() {
  const [params] = useSearchParams()
  const [number, setNumber] = useState(params.get('number') ?? '')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async (value: string) => {
    if (!value.trim()) return
    setLoading(true)
    setError('')
    const found = await getOrderByNumber(value)
    setLoading(false)
    if (!found) {
      setError('We could not find an order with that number. Check the confirmation email and try again.')
      setOrder(null)
      return
    }
    setOrder(found)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <PackageSearch className="size-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Track your order</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-500">
          Enter the order number from your confirmation email. It looks like <span className="font-mono font-semibold text-ink-700">AU-10042</span>.
        </p>
      </div>

      <Card className="mt-8 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            lookup(number)
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value.toUpperCase())}
            placeholder="AU-10042"
            className="font-mono"
          />
          <Button type="submit" loading={loading} className="sm:w-40">
            Track order
          </Button>
        </form>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        {!order && !error && (
          <p className="mt-4 text-[13px] text-ink-500">
            Trying the demo? Try <button onClick={() => { setNumber('AU-10042'); lookup('AU-10042') }} className="font-mono font-semibold text-brand-700 underline">AU-10042</button> or any number between{' '}
            <span className="font-mono">AU-10000</span> and <span className="font-mono">AU-10168</span>.
          </p>
        )}
      </Card>

      {loading && (
        <div className="mt-8 flex justify-center">
          <Spinner className="size-7" />
        </div>
      )}

      {order && (
        <div className="mt-8 space-y-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">Order</p>
                <p className="font-mono text-lg font-bold text-ink-900">{order.number}</p>
                <p className="mt-0.5 text-[13px] text-ink-500">Placed {shortDate(order.placedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>

            <ol className="mt-6 space-y-0">
              {order.timeline.map((e, i) => {
                const isLast = i === order.timeline.length - 1
                return (
                  <li key={`${e.label}-${i}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className={cn('flex size-8 items-center justify-center rounded-full', isLast ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500')}>
                        {e.label === 'Shipped' ? <Truck className="size-4" /> : e.label === 'Delivered' ? <Package className="size-4" /> : <MapPin className="size-4" />}
                      </span>
                      {!isLast && <span className="h-10 w-0.5 bg-ink-200" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-semibold text-ink-900">{e.label}</p>
                      <p className="text-xs text-ink-500">{dateTime(e.at)}</p>
                      {e.note && <p className="mt-1 text-[13px] text-ink-500">{e.note}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink-900">Items</h2>
            <ul className="mt-4 divide-y divide-ink-100">
              {order.items.map((item) => {
                const product = allProducts.find((p) => p.id === item.productId)
                return (
                  <li key={`${item.productId}-${item.color}`} className="flex items-center gap-3 py-3">
                    {product && <ProductImage product={product} selectedColor={item.color} className="size-12 shrink-0 rounded-lg" iconSize="sm" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{item.name}</p>
                      <p className="text-xs text-ink-500">
                        {item.brand} · Qty {item.qty}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900">{money(item.price * item.qty)}</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{money(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-ink-500">Discount</span><span className="text-emerald-600">− {money(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span>{order.shipping === 0 ? 'Free' : money(order.shipping)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Tax</span><span>{money(order.tax)}</span></div>
              <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold"><span>Total</span><span>{money(order.total)}</span></div>
            </div>
            {order.couponCode && (
              <p className="mt-3 text-[13px] text-ink-500">
                Promo applied: <Badge tone="green">{order.couponCode}</Badge>
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink-900">Delivery address</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              {order.address.fullName}
              <br />
              {order.address.line1}
              {order.address.line2 && (
                <>
                  <br />
                  {order.address.line2}
                </>
              )}
              <br />
              {order.address.city}, {order.address.state} {order.address.zip}
              <br />
              {order.address.country}
            </p>
          </Card>
        </div>
      )}

      <div className="mt-10 text-center text-sm text-ink-500">
        Need something else?{' '}
        <Link to="/contact" className="font-semibold text-brand-700 hover:underline">
          Contact support <ArrowRight className="inline size-3.5" />
        </Link>
      </div>
    </div>
  )
}
