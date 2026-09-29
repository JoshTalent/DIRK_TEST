import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Truck, MessageSquare, Package, RotateCcw, ExternalLink } from 'lucide-react'
import { listAllOrders } from '@/api/admin'
import { updateOrder } from '@/api/orders'
import { getProductMap, updateProduct } from '@/api/products'
import { money, dateTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types'
import { Button, Card, Modal, OrderStatusBadge, PaymentStatusBadge, Select, Spinner, Textarea } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { Panel } from '@/components/charts/Charts'
import { toast } from '@/store/toastStore'

const ALL_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

const ACTION_LABELS: Record<OrderStatus, string> = {
  pending: 'Back to awaiting payment',
  processing: 'Mark processing',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
  refunded: 'Refund order',
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [missing, setMissing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [restock, setRestock] = useState(true)

  useEffect(() => {
    listAllOrders().then((all) => {
      const found = all.find((o) => o.id === id)
      if (found) setOrder(found)
      else setMissing(true)
    })
  }, [id])

  if (missing) {
    return (
      <Card className="p-10 text-center">
        <p className="text-lg font-bold text-ink-900">Order not found</p>
        <p className="mt-1 text-[13px] text-ink-500">It may have been removed from the demo database.</p>
        <Link to="/admin/orders" className="mt-4 inline-block text-[13px] font-semibold text-brand-700 hover:underline">
          Back to all orders
        </Link>
      </Card>
    )
  }

  if (!order) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-7 text-brand-600" />
      </div>
    )
  }

  const productMap = getProductMap()

  const setStatus = async (status: OrderStatus) => {
    setBusy(true)
    try {
      setOrder(await updateOrder(order.id, { status }))
      if ((status === 'cancelled' || status === 'refunded') && restock) {
        for (const item of order.items) {
          const p = productMap[item.productId]
          if (p) await updateProduct(p.id, { stock: p.stock + item.qty })
        }
        toast.success('Order updated', 'Items returned to stock')
      } else {
        toast.success('Order updated', `${order.number} is now ${status}`)
      }
    } catch (err) {
      toast.error('Could not update', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const setPayment = async (paymentStatus: PaymentStatus) => {
    setBusy(true)
    try {
      setOrder(await updateOrder(order.id, { paymentStatus }))
      toast.success('Payment status updated', paymentStatus)
    } finally {
      setBusy(false)
    }
  }

  const addNote = async () => {
    if (!note.trim()) return
    setBusy(true)
    setOrder(await updateOrder(order.id, { note: note.trim() }))
    setBusy(false)
    setNote('')
    setNoteOpen(false)
    toast.success('Note added to the timeline')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link to="/admin/orders" className="mt-0.5 rounded-lg p-2 text-ink-500 transition hover:bg-ink-100">
            <ArrowLeft className="size-4.5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink-900">{order.number}</h1>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="mt-0.5 text-[13px] text-ink-500">
              Placed {dateTime(order.placedAt)} · {order.paymentMethod.toUpperCase()}
              {order.couponCode ? ` · coupon ${order.couponCode}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<Printer className="size-4" />} onClick={() => toast.info('Printing is disabled in this demo')}>
            Packing slip
          </Button>
          <Button variant="outline" icon={<MessageSquare className="size-4" />} onClick={() => setNoteOpen(true)}>
            Add note
          </Button>
        </div>
      </div>

      <Panel title="Fulfilment" description="Changing the status writes an event to the customer timeline.">
        <div className="flex flex-wrap items-center gap-2">
          {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
            <Button
              key={s}
              variant={s === 'cancelled' || s === 'refunded' ? 'outline' : 'primary'}
              size="sm"
              loading={busy}
              icon={s === 'shipped' ? <Truck className="size-3.5" /> : s === 'refunded' ? <RotateCcw className="size-3.5" /> : undefined}
              onClick={() => setStatus(s)}
              className={s === 'cancelled' || s === 'refunded' ? 'text-red-600' : undefined}
            >
              {ACTION_LABELS[s]}
            </Button>
          ))}
        </div>
        {(order.status === 'cancelled' || order.status === 'refunded') && (
          <label className="mt-4 flex cursor-pointer items-center gap-2.5 border-t border-ink-100 pt-4 text-[13px] text-ink-700">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="size-[18px] rounded-[6px] border-ink-300 accent-brand-600"
            />
            Return items to stock when cancelling or refunding
          </label>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Panel title={`Items (${order.items.reduce((s, i) => s + i.qty, 0)} units)`} bodyClassName="p-0">
            <ul className="divide-y divide-ink-100">
              {order.items.map((item) => {
                const p = productMap[item.productId]
                return (
                  <li key={item.productId + item.color} className="flex items-center gap-4 p-4">
                    {p ? (
                      <ProductImage product={p} className="size-14 shrink-0 rounded-xl" iconSize="sm" />
                    ) : (
                      <div className="size-14 shrink-0 rounded-xl bg-ink-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      {p ? (
                        <Link to={`/product/${p.slug}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-900 hover:text-brand-700">
                          {item.name}
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <p className="text-[13px] font-semibold text-ink-900">{item.name}</p>
                      )}
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="size-3 rounded-full ring-1 ring-ink-950/10" style={{ backgroundColor: item.color }} />
                          {item.color}
                        </span>
                        <span>· {item.brand}</span>
                        {p ? <span>· {p.sku}</span> : null}
                      </p>
                      {p && p.stock < 10 ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
                          <Package className="size-3" /> only {p.stock} left on hand
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-semibold text-ink-900">{money(item.price * item.qty)}</p>
                      <p className="text-xs text-ink-500">
                        {item.qty} × {money(item.price)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="space-y-1.5 border-t border-ink-100 bg-ink-50/60 p-5 text-[13px]">
              <TotalRow label="Subtotal" value={money(order.subtotal)} />
              {order.discount > 0 ? <TotalRow label="Discount" value={`-${money(order.discount)}`} tone="text-emerald-600" /> : null}
              <TotalRow label="Shipping" value={order.shipping === 0 ? 'Free' : money(order.shipping)} />
              <TotalRow label="Tax" value={money(order.tax)} />
              <div className="flex items-center justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-900">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Timeline" description="Everything the customer can see about this order.">
            <ol className="relative space-y-5 border-l border-ink-200 pl-6">
              {order.timeline.map((ev, i) => (
                <li key={i} className="relative">
                  <span
                    className={cn(
                      'absolute top-1 -left-[31px] size-3 rounded-full ring-4 ring-white',
                      i === order.timeline.length - 1 ? 'bg-brand-600' : 'bg-ink-300',
                    )}
                  />
                  <p className="text-[13px] font-semibold text-ink-900">{ev.label}</p>
                  <p className="text-xs text-ink-500">{dateTime(ev.at)}</p>
                  {ev.note ? <p className="mt-1 text-[13px] text-ink-600 italic">{ev.note}</p> : null}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Customer">
            <p className="text-sm font-semibold text-ink-900">{order.customerName}</p>
            <p className="text-[13px] text-ink-500">{order.customerEmail}</p>
            <dl className="mt-4 space-y-1 border-t border-ink-100 pt-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Phone</dt>
                <dd className="text-ink-800">{order.address.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Type</dt>
                <dd className="text-ink-800">{order.userId ? 'Registered' : 'Guest checkout'}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Shipping address">
            <address className="text-[13px] leading-relaxed text-ink-600 not-italic">
              {order.address.fullName}
              <br />
              {order.address.line1}
              {order.address.line2 ? (
                <>
                  <br />
                  {order.address.line2}
                </>
              ) : null}
              <br />
              {order.address.city}, {order.address.state} {order.address.zip}
              <br />
              {order.address.country}
            </address>
          </Panel>

          <Panel title="Payment">
            <div className="space-y-3">
              <p className="text-[13px] text-ink-600">Method: {order.paymentMethod.toUpperCase()}</p>
              <Select value={order.paymentStatus} onChange={(e) => setPayment(e.target.value as PaymentStatus)}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add an internal note"
        description="Notes are appended to the order timeline and visible to staff."
        footer={
          <>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy} disabled={!note.trim()} onClick={addNote}>
              Add note
            </Button>
          </>
        }
      >
        <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Customer asked to leave with the neighbour." />
      </Modal>
    </div>
  )
}

function TotalRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={cn('font-medium text-ink-900 tabular-nums', tone)}>{value}</span>
    </div>
  )
}
