import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search, Download, ArrowRight } from 'lucide-react'
import { listOrdersForUser } from '@/api/orders'
import { getProductMap } from '@/api/products'
import type { Order, OrderStatus } from '@/lib/types'
import { money, shortDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Button, Card, EmptyState, Input, OrderStatusBadge, Pagination, Select, Table } from '@/components/ui'
import type { Column } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { useAuthStore } from '@/store/authStore'

type Filter = 'all' | OrderStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 8
  const productMap = getProductMap()

  useEffect(() => {
    if (!user) return
    listOrdersForUser(user.id).then(setOrders)
  }, [user])

  const filtered = useMemo(() => {
    if (!orders) return []
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false
      if (q && !`${o.number} ${o.customerName}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [orders, filter, q])

  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const pages = Math.max(1, Math.ceil(filtered.length / perPage))

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: 'Order',
      cell: (o) => (
        <div>
          <p className="font-mono text-[13px] font-semibold text-ink-900">{o.number}</p>
          <p className="text-xs text-ink-500">{shortDate(o.placedAt)}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (o) => (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {o.items.slice(0, 3).map((item) => {
              const p = productMap[item.productId]
              return p ? (
                <ProductImage key={`${item.productId}-${item.color}`} product={p} selectedColor={item.color} className="size-9 rounded-md ring-2 ring-white" iconSize="sm" />
              ) : null
            })}
          </div>
          <span className="text-[13px] text-ink-500">
            {o.items.reduce((s, i) => s + i.qty, 0)} item{o.items.reduce((s, i) => s + i.qty, 0) === 1 ? '' : 's'}
          </span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (o) => <span className="font-semibold text-ink-900">{money(o.total)}</span>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      cell: () => <ArrowRight className="inline size-4 text-ink-300" />,
    },
  ]

  if (orders === null) {
    return (
      <Card>
        <Table<Order>
          columns={columns}
          rows={[]}
          rowKey={(o) => o.id}
          loading
          skeletonRows={6}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const count = f.value === 'all' ? orders.length : orders.filter((o) => o.status === f.value).length
            if (count === 0 && f.value !== 'all') return null
            return (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value)
                  setPage(1)
                }}
                className={cn(
                  'rounded-xl px-3.5 py-2 text-[13px] font-medium transition',
                  filter === f.value ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50',
                )}
              >
                {f.label}
                <span className={cn('ml-1.5 text-xs', filter === f.value ? 'text-white/60' : 'text-ink-400')}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <div className="relative w-56">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order number" className="h-10 pl-9" />
          </div>
          <Button variant="outline" className="h-10" icon={<Download className="size-4" />}>
            Export
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="size-6" />}
            title="No orders match"
            description={q ? 'Try a different order number.' : 'You have not placed an order in this category yet.'}
            action={
              <Link to="/shop">
                <Button>Start shopping</Button>
              </Link>
            }
          />
        ) : (
          <Table
            columns={columns}
            rows={paged}
            rowKey={(o) => o.id}
            onRowClick={(o) => (window.location.href = `/account/orders/${o.number}`)}
          />
        )}
      </Card>

      <Pagination page={page} pages={pages} total={filtered.length} onChange={setPage} />

      <div className="flex items-center justify-between rounded-2xl border border-dashed border-ink-300 bg-white p-5">
        <div>
          <p className="text-sm font-semibold text-ink-900">Need an invoice or a return?</p>
          <p className="text-[13px] text-ink-500">Every order can be downloaded as a PDF invoice, or returned within 30 days.</p>
        </div>
        <div className="flex gap-2">
          <Select className="hidden w-44 sm:block" defaultValue="">
            <option value="" disabled>
              Choose an order…
            </option>
            {orders.slice(0, 6).map((o) => (
              <option key={o.id} value={o.number}>
                {o.number}
              </option>
            ))}
          </Select>
          <Button variant="outline">Start a return</Button>
        </div>
      </div>
    </div>
  )
}
