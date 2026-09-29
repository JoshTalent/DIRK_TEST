import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DollarSign, ShoppingCart, Users, AlertTriangle, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { getAdminStats, type AdminStats } from '@/api/admin'
import { money, shortDate, timeAgo, compactNum } from '@/lib/format'
import { Badge, Card, OrderStatusBadge, Progress, Spinner, Table, type Column } from '@/components/ui'
import { CHART_COLORS, ChartTooltip, Kpi, Panel } from '@/components/charts/Charts'
import type { Order } from '@/lib/types'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    getAdminStats().then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-7 text-brand-600" />
      </div>
    )
  }

  const revenueDelta = stats.revenue30Prev
    ? ((stats.revenue30 - stats.revenue30Prev) / stats.revenue30Prev) * 100
    : 0
  const orderDelta = stats.orders30Prev ? ((stats.orders30 - stats.orders30Prev) / stats.orders30Prev) * 100 : 0

  const recentColumns: Column<Order>[] = [
    {
      key: 'number',
      header: 'Order',
      cell: (o) => (
        <Link to={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
          {o.number}
        </Link>
      ),
    },
    { key: 'customerName', header: 'Customer', cell: (o) => o.customerName },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => money(o.total) },
    { key: 'status', header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
    { key: 'placedAt', header: 'Placed', align: 'right', cell: (o) => timeAgo(o.placedAt) },
  ]

  const funnelData = stats.funnel.map((f, i) => ({ ...f, fill: CHART_COLORS[i % CHART_COLORS.length] }))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Revenue · last 30 days"
          value={money(stats.revenue30)}
          delta={revenueDelta}
          icon={<DollarSign className="size-5" />}
          hint={`vs ${money(stats.revenue30Prev)} prior 30 days`}
        />
        <Kpi
          label="Orders · last 30 days"
          value={stats.orders30.toLocaleString()}
          delta={orderDelta}
          tone="green"
          icon={<ShoppingCart className="size-5" />}
          hint={`${stats.orders30Prev} in the prior period`}
        />
        <Kpi
          label="Average order value"
          value={money(stats.aov)}
          tone="purple"
          icon={<TrendingUp className="size-5" />}
          hint={`${stats.newCustomers30} new customers this month`}
        />
        <Kpi
          label="Total customers"
          value={stats.customers.toLocaleString()}
          tone="amber"
          icon={<Users className="size-5" />}
          hint={`${stats.refundRate}% refund rate across all time`}
        />
      </div>

      {stats.pendingReviews > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
          <p className="flex-1 text-[13px] text-amber-900">
            <span className="font-semibold">{stats.pendingReviews} reviews</span> are waiting for moderation. Reviews stay
            invisible to shoppers until a moderator approves them.
          </p>
          <Link
            to="/admin/reviews"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-amber-900 hover:underline"
          >
            Review queue <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Revenue, 12 months"
          description="This year against the same months last year"
          className="xl:col-span-2"
          action={
            <div className="flex items-center gap-4 text-[11px] font-medium text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand-600" /> This year
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-ink-300" /> Last year
              </span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.revenueSeries} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f40e0" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#1f40e0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7b8497' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#7b8497' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => compactNum(v)}
              />
              <Tooltip content={<ChartTooltip formatter={(v) => money(v)} />} />
              <Area type="monotone" dataKey="prev" name="Last year" stroke="#c7ccd8" strokeWidth={2} fill="none" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="revenue" name="This year" stroke="#1f40e0" strokeWidth={2.5} fill="url(#gRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Revenue by category" description="Trailing 12 months, all paid orders">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.categorySplit}
                dataKey="revenue"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
                strokeWidth={0}
              >
                {stats.categorySplit.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => money(v)} />} />
              <LabelList
                dataKey="name"
                position="outside"
                style={{ fontSize: 11, fill: '#5b6478', fontWeight: 500 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Orders, last 14 days" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.dailySeries} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7b8497' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: '#7b8497' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4f5f8' }} />
              <Bar dataKey="orders" name="Orders" fill="#1f40e0" radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Conversion funnel" description="Last 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <FunnelChart>
              <Tooltip content={<ChartTooltip />} />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
                <LabelList
                  position="right"
                  fill="#5b6478"
                  stroke="none"
                  dataKey="name"
                  style={{ fontSize: 11, fontWeight: 500 }}
                />
                <LabelList
                  position="right"
                  fill="#0d1526"
                  stroke="none"
                  dataKey="value"
                  formatter={(v) => compactNum(Number(v))}
                  style={{ fontSize: 11, fontWeight: 700 }}
                  offset={70}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Top products" description="By trailing revenue" className="xl:col-span-2" bodyClassName="p-0">
          <ul className="divide-y divide-ink-100">
            {stats.topProducts.map((row, i) => (
              <li key={row.product.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-5 text-[13px] font-bold text-ink-300">{i + 1}</span>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {row.product.brand.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products?q=${encodeURIComponent(row.product.name)}`} className="block truncate text-[13px] font-semibold text-ink-900 hover:text-brand-700">
                    {row.product.name}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {row.product.brand} · {row.units.toLocaleString()} units
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-ink-900 tabular-nums">{money(row.revenue)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Low stock" description="Active items at or below 25 units" bodyClassName="p-0">
          {stats.lowStock.length === 0 ? (
            <p className="p-5 text-[13px] text-ink-500">Everything is comfortably stocked.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold text-ink-900">{p.name}</p>
                    <Badge tone={p.stock === 0 ? 'red' : p.stock < 10 ? 'red' : 'amber'}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <Progress value={Math.min(100, (p.stock / 25) * 100)} tone={p.stock < 10 ? 'red' : 'amber'} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Latest orders"
          className="xl:col-span-2"
          bodyClassName="p-0"
          action={
            <Link to="/admin/orders" className="text-[13px] font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          }
        >
          <Table columns={recentColumns} rows={stats.recentOrders} rowKey={(o) => o.id}
            emptyTitle="No orders yet" />
        </Panel>

        <div className="space-y-5">
          <Panel title="Orders by status">
            <ul className="space-y-2.5">
              {stats.statusSplit
                .sort((a, b) => b.value - a.value)
                .map((s) => {
                  return (
                    <li key={s.name} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="flex items-center gap-2 text-ink-600">
                        <OrderStatusBadge status={s.name as Order['status']} />
                      </span>
                      <span className="font-semibold text-ink-900 tabular-nums">{s.value.toLocaleString()}</span>
                    </li>
                  )
                })}
            </ul>
          </Panel>

          <Panel title="Acquisition channels" description="Share of new sessions">
            <ul className="space-y-3">
              {stats.channelSplit.map((c) => (
                <li key={c.name}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-600">{c.name}</span>
                    <span className="font-semibold text-ink-900 tabular-nums">{c.value}%</span>
                  </div>
                  <div className="mt-1.5">
                    <Progress value={c.value} tone="brand" />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Card className="flex items-start gap-3 p-5">
            <Clock className="mt-0.5 size-4.5 shrink-0 text-ink-400" />
            <div>
              <p className="text-sm font-semibold text-ink-900">Data freshness</p>
              <p className="mt-1 text-[13px] text-ink-600">
                Figures recompute from the local demo database on every load. Most recent order{' '}
                {stats.recentOrders[0] ? timeAgo(stats.recentOrders[0].placedAt) : 'n/a'}
                {stats.recentOrders[0] ? ` (${shortDate(stats.recentOrders[0].placedAt)})` : ''}.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
