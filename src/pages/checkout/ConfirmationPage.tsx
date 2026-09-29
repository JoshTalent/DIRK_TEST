import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package, Truck, Mail, Printer, ArrowRight, Copy } from 'lucide-react'
import { getOrderByNumber } from '@/api/orders'
import type { Order } from '@/lib/types'
import { money, dateTime, copyToClipboard } from '@/lib/format'
import { Badge, Button, Card, OrderStatusBadge, PaymentStatusBadge, Spinner } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { products as allProducts } from '@/data/catalog'
import { toast } from '@/store/toastStore'
import { Logo } from '@/components/layout/Logo'

export default function ConfirmationPage() {
  const { number = '' } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrderByNumber(number).then((o) => {
      setOrder(o)
      setLoading(false)
    })
  }, [number])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-4 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Order not found</h1>
        <p className="text-ink-500">We could not find order {number}.</p>
        <Link to="/shop" className="text-sm font-semibold text-brand-700 hover:underline">
          Continue shopping
        </Link>
      </div>
    )
  }

  const eta = new Date(new Date(order.placedAt).getTime() + 5 * 86400000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-ink-50 pb-16">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Logo />
          <Link to="/shop" className="text-sm font-semibold text-ink-600 hover:text-ink-900">
            Continue shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center">
          <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-8" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Thank you — order confirmed</h1>
          <p className="mx-auto mt-3 max-w-lg text-ink-600">
            We have emailed a receipt to <span className="font-semibold text-ink-800">{order.customerEmail}</span>. Your
            order should arrive by <span className="font-semibold text-ink-800">{eta}</span>.
          </p>
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-ink-200 bg-white px-5 py-3">
            <span className="text-[13px] text-ink-500">Order number</span>
            <span className="font-mono text-base font-bold text-ink-900">{order.number}</span>
            <button
              onClick={() => {
                copyToClipboard(order.number)
                toast.success('Order number copied')
              }}
              className="text-ink-400 transition hover:text-ink-800"
              aria-label="Copy order number"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
          {order.couponCode && <Badge tone="green">{order.couponCode} applied</Badge>}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card className="p-5">
            <h2 className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">Shipping to</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-700">
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
          <Card className="p-5">
            <h2 className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">Payment</h2>
            <p className="mt-3 text-sm capitalize text-ink-700">
              {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod}
            </p>
            <p className="mt-1 text-[13px] text-ink-500">
              {order.paymentStatus === 'paid' ? 'Captured and settled' : 'Due on delivery'}
            </p>
            <p className="mt-3 text-sm font-semibold text-ink-900">{money(order.total)}</p>
          </Card>
          <Card className="p-5">
            <h2 className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">What happens next</h2>
            <ol className="mt-3 space-y-2 text-[13px] text-ink-600">
              <li className="flex gap-2"><Package className="size-3.5 shrink-0" /> Picked and packed within 24 hours</li>
              <li className="flex gap-2"><Truck className="size-3.5 shrink-0" /> Tracking emailed when it ships</li>
              <li className="flex gap-2"><Mail className="size-3.5 shrink-0" /> Delivery by {eta}</li>
            </ol>
          </Card>
        </div>

        <Card className="mt-5 overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-900">
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </h2>
          </div>
          <ul className="divide-y divide-ink-100">
            {order.items.map((item) => {
              const product = allProducts.find((p) => p.id === item.productId)
              return (
                <li key={`${item.productId}-${item.color}`} className="flex items-center gap-4 p-5">
                  {product && <ProductImage product={product} selectedColor={item.color} className="size-16 shrink-0 rounded-xl" iconSize="sm" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                    <p className="text-[13px] text-ink-500">
                      {item.brand} · Qty {item.qty} · {item.color}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">{money(item.price * item.qty)}</span>
                </li>
              )
            })}
          </ul>
          <div className="space-y-2 border-t border-ink-100 bg-ink-50/60 p-5 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{money(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-ink-500">Discount</span><span className="text-emerald-600">− {money(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span>{order.shipping === 0 ? 'Free' : money(order.shipping)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Tax</span><span>{money(order.tax)}</span></div>
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-900">
              <span>Total paid</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="text-base font-semibold text-ink-900">Order timeline</h2>
          <ol className="mt-4 space-y-4">
            {order.timeline.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 size-2.5 shrink-0 rounded-full bg-brand-500" />
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.label}</p>
                  <p className="text-xs text-ink-500">{dateTime(e.at)}</p>
                  {e.note && <p className="text-[13px] text-ink-500">{e.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={`/account/orders/${order.number}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-sm font-semibold text-white transition hover:bg-ink-800"
          >
            View order details <ArrowRight className="size-4" />
          </Link>
          <Button variant="outline" icon={<Printer className="size-4" />} onClick={() => window.print()}>
            Print receipt
          </Button>
          <Link
            to={`/track?number=${order.number}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
          >
            <Truck className="size-4" /> Track parcel
          </Link>
        </div>
      </div>
    </div>
  )
}
