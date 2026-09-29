import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Download, Filter, ExternalLink } from 'lucide-react'
import { listAllOrders } from '@/api/admin'
import { getProductMap } from '@/api/products'
import { money, dateTime, shortDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types'
import {
  Badge,
  Button,
  Input,
  OrderStatusBadge,
  Pagination,
  PaymentStatusBadge,
  Select,
  Table,
  type Column,
} from '@/components/ui'
import { Panel } from '@/components/charts/Charts'
import { toast } from '@/store/toastStore'

const PER_PAGE = 12

const STATUSES: (OrderStatus | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const PAYMENTS: (PaymentStatus | 'all')[] = ['all', 'unpaid', 'paid', 'refunded', 'failed']

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [payment, setPayment] = useState<PaymentStatus | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    listAllOrders().then((all) => setOrders([...all].sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt))))
  }, [])

  const filtered = useMemo(() => {
    if (!orders) return []
    const term = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false
      if (payment !== 'all' && o.paymentStatus !== payment) return false
      if (from && o.placedAt < new Date(from).toISOString()) return false
      if (to && o.placedAt > new Date(`${to}T23:59:59`).toISOString()) return false
      if (term) {
        const haystack = `${o.number} ${o.customerName} ${o.customerEmail} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase()
        if (!term.split(/\s+/).every((w) => haystack.includes(w))) return false
      }
      return true
    })
  }, [orders, search, status, payment, from, to])

  useEffect(() => {
    setPage(1)
  }, [search, status, payment, from, to])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)
  const productMap = getProductMap()

  const revenue = filtered.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)

  const clear = () => {
    setSearch('')
    setStatus('all')
    setPayment('all')
    setFrom('')
    setTo('')
  }

  const columns: Column<Order>[] = [
    {
      key: 'number',
      header: 'Order',
      cell: (o) => (
        <div>
          <Link to={`/admin/orders/${o.id}`} className="text-[13px] font-semibold text-brand-700 hover:underline">
            {o.number}
          </Link>
          <p className="text-xs text-ink-500">{shortDate(o.placedAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-900">{o.customerName}</p>
          <p className="truncate text-xs text-ink-500">{o.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (o) => (
        <div className="flex items-center gap-1.5">
          {o.items.slice(0, 3).map((item) => {
            const p = productMap[item.productId]
            return p ? (
              <span
                key={item.productId + item.color}
                title={`${item.name} × ${item.qty}`}
                className="size-6 rounded-md ring-1 ring-ink-950/5 ring-inset"
                style={{ backgroundColor: item.color }}
              />
            ) : null
          })}
          {o.items.length > 3 && <span className="text-xs text-ink-400">+{o.items.length - 3}</span>}
          <span className="ml-1 text-xs text-ink-500">
            {o.items.reduce((s, i) => s + i.qty, 0)} units
          </span>
        </div>
      ),
    },
    { key: 'payment', header: 'Payment', cell: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
    { key: 'status', header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (o) => (
        <div className="whitespace-nowrap">
          <span className="text-[13px] font-semibold text-ink-900">{money(o.total)}</span>
          {o.discount > 0 && <p className="text-xs text-emerald-600">-{money(o.discount)}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (o) => (
        <Link
          to={`/admin/orders/${o.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[13px] font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          Manage <ExternalLink className="size-3" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Orders</h1>
          <p className="text-[13px] text-ink-500">
            {filtered.length.toLocaleString()} matching · {money(revenue)} collected
          </p>
        </div>
        <Button
          variant="outline"
          icon={<Download className="size-4" />}
          onClick={() => toast.info('Exports are disabled in this demo', `${filtered.length} rows would be written to CSV.`)}
        >
          Export CSV
        </Button>
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order number, customer, product…" className="pl-9" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 hover:bg-ink-100">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')} className="w-40">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'Any status' : s}
              </option>
            ))}
          </Select>
          <Select value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus | 'all')} className="w-40">
            {PAYMENTS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'Any payment' : s}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label="From date" />
            <span className="text-ink-400">–</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label="To date" />
          </div>
          <Button variant="ghost" icon={<Filter className="size-4" />} onClick={clear}>
            Clear
          </Button>
        </div>

        <Table
          columns={columns}
          rows={visible}
          rowKey={(o) => o.id}
          loading={orders === null}
          skeletonRows={10}
          emptyTitle="No orders match"
          emptyDescription="Try widening the date range or clearing filters."
          emptyAction={
            <Button variant="outline" onClick={clear}>
              Clear filters
            </Button>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3">
          <p className="text-[13px] text-ink-500">
            Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()}
          </p>
          <Pagination page={safePage} pages={pages} onChange={setPage} />
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        {STATUSES.filter((s) => s !== 'all').map((s) => {
          const count = orders?.filter((o) => o.status === s).length ?? 0
          const pct = orders?.length ? (count / orders.length) * 100 : 0
          return (
            <button
              key={s}
              onClick={() => setStatus(status === s ? 'all' : s)}
              className={cn(
                'rounded-2xl border p-4 text-left transition',
                status === s ? 'border-brand-300 bg-brand-50/40' : 'border-ink-200 bg-white hover:border-ink-300',
              )}
            >
              <div className="flex items-center justify-between">
                <OrderStatusBadge status={s} />
                <span className="text-lg font-bold text-ink-900 tabular-nums">{count.toLocaleString()}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div className={cn('h-full rounded-full', s === 'refunded' || s === 'cancelled' ? 'bg-red-400' : 'bg-brand-500')} style={{ width: `${pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Badge tone="neutral">Demo</Badge>
        Cancelling or refunding an order updates the customer timeline immediately. Last synced {orders ? dateTime(orders[0].placedAt) : '—'}.
      </div>
    </div>
  )
}
