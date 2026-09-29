import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  CreditCard,
  Printer,
  RotateCcw,
  XCircle,
  CheckCircle2,
  ClipboardCopy,
  ShoppingBag,
} from 'lucide-react'
import { getOrderByNumber, updateOrder } from '@/api/orders'
import { getProductMap } from '@/api/products'
import type { Order } from '@/lib/types'
import { money, dateTime, shortDate, copyToClipboard } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, Modal, OrderStatusBadge, PaymentStatusBadge, Spinner, Field, Textarea, Select } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { toast } from '@/store/toastStore'

const FLOW = ['pending', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const { number = '' } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const addToCart = useCartStore((s) => s.add)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [reason, setReason] = useState('damaged')
  const [note, setNote] = useState('')
  const [working, setWorking] = useState(false)
  const productMap = getProductMap()

  useEffect(() => {
    if (!user) return
    getOrderByNumber(number, user.id).then((o) => {
      setOrder(o)
      setLoading(false)
    })
  }, [number, user])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )
  }

  if (!order) {
    return (
      <Card className="p-10 text-center">
        <h2 className="text-lg font-bold text-ink-900">Order not found</h2>
        <p className="mt-1 text-sm text-ink-500">Order {number} is not on your account.</p>
        <Button className="mt-5" onClick={() => navigate('/account/orders')}>
          Back to orders
        </Button>
      </Card>
    )
  }

  const currentStep = FLOW.indexOf(order.status)
  const canCancel = ['pending', 'processing'].includes(order.status)
  const canReturn = order.status === 'delivered'
  const eta = new Date(new Date(order.placedAt).getTime() + 5 * 86400000)

  const act = async (status: 'cancelled' | 'refunded', message: string) => {
    setWorking(true)
    const updated = await updateOrder(order.id, { status, note: message })
    setOrder(updated)
    setWorking(false)
    setCancelOpen(false)
    setReturnOpen(false)
    toast.success(status === 'cancelled' ? 'Order cancelled' : 'Return started', message)
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/account/orders')} className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> All orders
      </button>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-100 p-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-ink-900">{order.number}</h1>
              <button
                onClick={() => {
                  copyToClipboard(order.number)
                  toast.success('Order number copied')
                }}
                className="text-ink-400 hover:text-ink-700"
                aria-label="Copy order number"
              >
                <ClipboardCopy className="size-3.5" />
              </button>
            </div>
            <p className="mt-0.5 text-[13px] text-ink-500">
              Placed {shortDate(order.placedAt)} at {dateTime(order.placedAt).split(', ')[1]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
            {order.couponCode && <Badge tone="green">{order.couponCode}</Badge>}
          </div>
        </div>

        {order.status !== 'cancelled' && order.status !== 'refunded' && (
          <div className="border-b border-ink-100 bg-ink-50/60 p-5">
            <div className="flex items-center justify-between">
              {FLOW.map((s, i) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-xs font-bold transition',
                        i < currentStep
                          ? 'bg-emerald-500 text-white'
                          : i === currentStep
                            ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                            : 'bg-ink-200 text-ink-500',
                      )}
                    >
                      {i < currentStep ? <CheckCircle2 className="size-4" /> : i + 1}
                    </span>
                    <span className={cn('text-[11px] font-medium', i <= currentStep ? 'text-ink-800' : 'text-ink-400')}>
                      {s === 'pending' ? 'Placed' : s[0].toUpperCase() + s.slice(1)}
                    </span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <span className={cn('mx-2 h-0.5 flex-1', i < currentStep ? 'bg-emerald-500' : 'bg-ink-200')} />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-ink-600">
              <Truck className="size-4 text-ink-400" />
              Estimated delivery <span className="font-semibold">{shortDate(eta.toISOString())}</span>
            </p>
          </div>
        )}

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">
              Items ({order.items.reduce((s, i) => s + i.qty, 0)})
            </h2>
            <ul className="mt-3 divide-y divide-ink-100">
              {order.items.map((item) => {
                const product = productMap[item.productId]
                return (
                  <li key={`${item.productId}-${item.color}`} className="flex items-center gap-4 py-3">
                    {product && (
                      <Link to={`/product/${product.slug}`}>
                        <ProductImage product={product} selectedColor={item.color} className="size-16 rounded-xl" iconSize="sm" />
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                      <p className="text-[13px] text-ink-500">
                        {item.brand} · {item.color} · Qty {item.qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">{money(item.price * item.qty)}</p>
                      {item.qty > 1 && <p className="text-xs text-ink-400">{money(item.price)} each</p>}
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ShoppingBag className="size-3.5" />}
                onClick={() => {
                  order.items.forEach((i) => {
                    const p = productMap[i.productId]
                    if (p) addToCart(p.id, i.color, i.qty)
                  })
                  toast.success('Added to bag', `${order.items.length} items from ${order.number}`)
                }}
              >
                Buy these again
              </Button>
              <Button variant="outline" size="sm" icon={<Printer className="size-3.5" />} onClick={() => window.print()}>
                Print invoice
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-ink-200 p-4">
              <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-ink-400 uppercase">
                <MapPin className="size-3.5" /> Delivery address
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
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
                <br />
                <span className="text-ink-500">{order.address.phone}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-ink-200 p-4">
              <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-ink-400 uppercase">
                <CreditCard className="size-3.5" /> Payment
              </h3>
              <p className="mt-2.5 text-[13px] text-ink-700 capitalize">
                {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod}
              </p>
              <p className="text-xs text-ink-500">
                {order.paymentStatus === 'paid' ? 'Captured in full' : order.paymentStatus}
              </p>
            </div>

            <div className="rounded-2xl border border-ink-200 p-4">
              <h3 className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">Total</h3>
              <dl className="mt-2.5 space-y-1.5 text-[13px]">
                <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
                {order.discount > 0 && (
                  <div className="flex justify-between"><dt className="text-ink-500">Discount</dt><dd className="text-emerald-600">− {money(order.discount)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{order.shipping === 0 ? 'Free' : money(order.shipping)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-500">Tax</dt><dd>{money(order.tax)}</dd></div>
                <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-900">
                  <dt>Total</dt>
                  <dd>{money(order.total)}</dd>
                </div>
              </dl>
            </div>

            {(canCancel || canReturn) && (
              <div className="flex flex-col gap-2">
                {canCancel && (
                  <Button variant="outline" full icon={<XCircle className="size-4" />} onClick={() => setCancelOpen(true)}>
                    Cancel order
                  </Button>
                )}
                {canReturn && (
                  <Button variant="outline" full icon={<RotateCcw className="size-4" />} onClick={() => setReturnOpen(true)}>
                    Start a return
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-ink-100 bg-ink-50/50 p-5">
          <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-ink-400 uppercase">
            <Package className="size-3.5" /> Timeline
          </h3>
          <ol className="mt-4 space-y-3">
            {[...order.timeline].reverse().map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ink-300" />
                <div>
                  <p className="text-[13px] font-medium text-ink-900">{e.label}</p>
                  <p className="text-xs text-ink-500">{dateTime(e.at)}</p>
                  {e.note && <p className="text-[13px] text-ink-500">{e.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={`Cancel ${order.number}?`}
        description="Stock is released back to the catalogue and any capture is refunded."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button variant="danger" loading={working} onClick={() => act('cancelled', 'Cancelled at customer request')}>
              Cancel order
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This cannot be undone. If you have already chosen a replacement,{' '}
          <button onClick={() => setCancelOpen(false)} className="font-semibold text-brand-700 hover:underline">
            buy it again instead
          </button>
          .
        </p>
      </Modal>

      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Start a return"
        description="We will email a prepaid label within a few minutes."
        footer={
          <>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button loading={working} onClick={() => act('refunded', `Return requested — ${reason}`)}>
              Create return
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Why are you returning this?" required>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="damaged">Arrived damaged</option>
              <option value="not-as-described">Not as described</option>
              <option value="no-longer-needed">No longer needed</option>
              <option value="wrong-item">Wrong item sent</option>
              <option value="better-price">Found it cheaper elsewhere</option>
            </Select>
          </Field>
          <Field label="Anything else we should know?">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </Field>
          <p className="rounded-xl bg-ink-50 p-3 text-[13px] text-ink-600">
            Returns are free for 30 days after delivery. Refunds are issued to the original payment method within two
            business days of the parcel arriving back at our warehouse.
          </p>
        </div>
      </Modal>
    </div>
  )
}
