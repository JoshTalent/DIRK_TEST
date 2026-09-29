import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp, RefreshCw, Download } from 'lucide-react'
import { getAdminStats, listAllOrders } from '@/api/admin'
import { getCategories, getProductMap } from '@/api/products'
import { money, compactNum } from '@/lib/format'
import { Button, Spinner, Progress } from '@/components/ui'
import { CHART_COLORS, ChartTooltip, Panel } from '@/components/charts/Charts'
import { toast } from '@/store/toastStore'

type Range = '7' | '30' | '90' | '365'

const RANGE_LABELS: Record<Range, string> = {
  '7': 'Last 7 days',
  '30': 'Last 30 days',
  '90': 'Last 90 days',
  '365': 'Last 12 months',
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>('30')
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null)
  const [unitsByCategory, setUnitsByCategory] = useState<{ name: string; units: number }[]>([])

  useEffect(() => {
    getAdminStats().then(setStats)
  }, [])

  useEffect(() => {
    listAllOrders().then((orders) => {
      const days = Number(range)
      const cutoff = Date.now() - days * 86400000
      const units = new Map<string, number>()
      for (const o of orders) {
        if (new Date(o.placedAt).getTime() < cutoff) continue
        for (const item of o.items) {
          const p = getProductMap()[item.productId]
          if (p) units.set(p.categoryId, (units.get(p.categoryId) ?? 0) + item.qty)
        }
      }
      setUnitsByCategory(
        getCategories()
          .map((c) => ({ name: c.name, units: units.get(c.id) ?? 0 }))
          .sort((a, b) => b.units - a.units),
      )
    })
  }, [range])

  const dailyWindowed = useMemo(() => {
    if (!stats) return []
    const n = Number(range) <= 14 ? 14 : range === '30' ? 30 : stats.dailySeries.length
    return stats.dailySeries.slice(-n)
  }, [stats, range])

  const growth = useMemo(() => {
    if (!stats || !stats.revenue30Prev) return 0
    return ((stats.revenue30 - stats.revenue30Prev) / stats.revenue30Prev) * 100
  }, [stats])

  const categoryRevenue = useMemo(() => {
    if (!stats) return []
    return stats.categorySplit.map((c) => ({ name: c.name, revenue: c.revenue, products: c.value }))
  }, [stats])

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-7 text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Analytics</h1>
          <p className="text-[13px] text-ink-500">
            {RANGE_LABELS[range]} · revenue is up {Math.abs(growth).toFixed(1)}% against the previous period.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-ink-200 p-1">
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                  range === r ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <Button variant="outline" icon={<RefreshCw className="size-4" />} onClick={() => getAdminStats().then(setStats)}>
            Refresh
          </Button>
          <Button
            variant="outline"
            icon={<Download className="size-4" />}
            onClick={() => toast.info('Exports are disabled in this demo')}
          >
            CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Revenue (30d)', value: money(stats.revenue30) },
          { label: 'Orders (30d)', value: stats.orders30.toLocaleString() },
          { label: 'AOV', value: money(stats.aov) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink-200 bg-white p-5">
            <p className="text-[13px] font-medium text-ink-500">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <Panel title="Revenue vs prior period" description="Monthly, this year against last year">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.revenueSeries} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7b8497' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#7b8497' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => compactNum(v)}
            />
            <Tooltip content={<ChartTooltip formatter={(v) => money(v)} />} />
            <Line type="monotone" dataKey="prev" name="Last year" stroke="#c7ccd8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="revenue" name="This year" stroke="#1f40e0" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={`Daily orders · ${RANGE_LABELS[range].toLowerCase()}`}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyWindowed} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#7b8497' }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(dailyWindowed.length / 8))}
              />
              <YAxis tick={{ fontSize: 11, fill: '#7b8497' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#0f766e" strokeWidth={2} fill="url(#gOrders)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Units sold by category" description={RANGE_LABELS[range]}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={unitsByCategory} layout="vertical" margin={{ top: 4, right: 16, left: 12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#7b8497' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={92}
                tick={{ fontSize: 11, fill: '#7b8497' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4f5f8' }} />
              <Bar dataKey="units" name="Units" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {unitsByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Revenue share" className="xl:col-span-2">
          <div className="grid gap-6 sm:grid-cols-[280px_1fr]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={92}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {categoryRevenue.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => money(v)} />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2.5">
              {categoryRevenue.map((c, i) => {
                const total = categoryRevenue.reduce((s, x) => s + x.revenue, 0) || 1
                const pct = (c.revenue / total) * 100
                return (
                  <li key={c.name}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-ink-700">
                        <span className="size-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {c.name}
                        <span className="text-xs text-ink-400">({c.products})</span>
                      </span>
                      <span className="font-semibold text-ink-900 tabular-nums">{money(c.revenue)}</span>
                    </div>
                    <div className="mt-1.5">
                      <Progress value={pct} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </Panel>

        <Panel title="Checkout health" description="Funnel from session to purchase">
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart
              data={stats.funnel.map((f) => ({ name: f.stage, value: f.value }))}
              innerRadius="28%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" background cornerRadius={6} />
              <Tooltip content={<ChartTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <ul className="mt-4 space-y-1.5">
            {stats.funnel.map((f, i) => {
              const prev = stats.funnel[i - 1]?.value ?? f.value
              const pct = (f.value / prev) * 100
              return (
                <li key={f.stage} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-600">{f.stage}</span>
                  <span className="font-semibold text-ink-900 tabular-nums">
                    {compactNum(f.value)}
                    {i > 0 && <span className="ml-1.5 text-xs font-medium text-ink-400">{pct.toFixed(1)}%</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Top products" description="Trailing revenue" bodyClassName="p-0">
        <ul className="divide-y divide-ink-100">
          {stats.topProducts.map((row, i) => (
            <li key={row.product.id} className="flex items-center gap-4 px-5 py-3">
              <span className="w-5 text-[13px] font-bold text-ink-300">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-900">{row.product.name}</p>
                <p className="text-xs text-ink-500">
                  {row.product.brand} · {row.units.toLocaleString()} units · {row.product.stock} in stock
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold text-ink-900 tabular-nums">{money(row.revenue)}</p>
                <p className="flex items-center justify-end gap-1 text-xs text-emerald-600">
                  <TrendingUp className="size-3" />
                  {money(row.revenue / Math.max(1, row.units))} avg
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
