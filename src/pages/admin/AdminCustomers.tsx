import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Users, Mail, Ban, CheckCircle2, MapPin, CalendarDays } from 'lucide-react'
import { listCustomers, setCustomerStatus } from '@/api/admin'
import { money, shortDate, timeAgo, compactNum } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { User } from '@/lib/types'
import { Avatar, Badge, Button, Card, Input, Pagination, Table, type Column } from '@/components/ui'
import { Panel } from '@/components/charts/Charts'
import { toast } from '@/store/toastStore'

type Row = { user: User; orders: number; spend: number; lastOrder: string | null }

const PER_PAGE = 12

export default function AdminCustomers() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'spend' | 'orders' | 'recent' | 'name'>('spend')
  const [page, setPage] = useState(1)

  useEffect(() => {
    listCustomers().then(setRows)
  }, [])

  const filtered = useMemo(() => {
    if (!rows) return []
    const term = search.trim().toLowerCase()
    const list = rows.filter((r) => {
      if (!term) return true
      return `${r.user.name} ${r.user.email} ${r.user.addresses.map((a) => a.city).join(' ')}`
        .toLowerCase()
        .includes(term)
    })
    return list.sort((a, b) => {
      switch (sort) {
        case 'orders':
          return b.orders - a.orders
        case 'recent':
          return +(new Date(b.lastOrder ?? b.user.createdAt).getTime()) - +(new Date(a.lastOrder ?? a.user.createdAt).getTime())
        case 'name':
          return a.user.name.localeCompare(b.user.name)
        default:
          return b.spend - a.spend
      }
    })
  }, [rows, search, sort])

  useEffect(() => {
    setPage(1)
  }, [search, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const toggleStatus = async (row: Row) => {
    const next: User['status'] = row.user.status === 'active' ? 'suspended' : 'active'
    try {
      await setCustomerStatus(row.user.id, next)
      setRows((list) =>
        list?.map((r) => (r.user.id === row.user.id ? { ...r, user: { ...r.user, status: next } } : r)) ?? null,
      )
      toast.success(next === 'active' ? 'Account reactivated' : 'Account suspended', row.user.name)
    } catch {
      toast.error('Could not update the account')
    }
  }

  const totalSpend = rows?.reduce((s, r) => s + r.spend, 0) ?? 0
  const repeat = rows?.filter((r) => r.orders > 1).length ?? 0

  const columns: Column<Row>[] = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.user.name} color={r.user.avatarColor} size={36} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink-900">{r.user.name}</p>
            <p className="truncate text-xs text-ink-500">{r.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (r) => {
        const a = r.user.addresses[0]
        return a ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-600">
            <MapPin className="size-3.5 text-ink-400" />
            {a.city}, {a.country === 'United States' ? 'US' : a.country}
          </span>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        )
      },
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      cell: (r) => <span className="text-[13px] font-medium text-ink-800 tabular-nums">{r.orders}</span>,
    },
    {
      key: 'spend',
      header: 'Lifetime spend',
      align: 'right',
      cell: (r) => <span className="text-[13px] font-semibold text-ink-900 tabular-nums">{money(r.spend)}</span>,
    },
    {
      key: 'lastOrder',
      header: 'Last order',
      align: 'right',
      cell: (r) => (
        <span className="text-[13px] text-ink-600">{r.lastOrder ? timeAgo(r.lastOrder) : 'Never'}</span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      align: 'right',
      cell: (r) => <span className="text-xs text-ink-500">{shortDate(r.user.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge tone={r.user.status === 'active' ? 'green' : 'red'}>{r.user.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <a
            href={`mailto:${r.user.email}`}
            title="Email customer"
            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
          >
            <Mail className="size-4" />
          </a>
          <button
            onClick={() => toggleStatus(r)}
            title={r.user.status === 'active' ? 'Suspend account' : 'Reactivate account'}
            className={cn(
              'rounded-lg p-2 transition',
              r.user.status === 'active'
                ? 'text-ink-400 hover:bg-red-50 hover:text-red-600'
                : 'text-ink-400 hover:bg-emerald-50 hover:text-emerald-600',
            )}
          >
            {r.user.status === 'active' ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Customers</h1>
        <p className="text-[13px] text-ink-500">
          {rows?.length.toLocaleString() ?? 0} accounts · {money(totalSpend)} lifetime revenue · {repeat} repeat buyers
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-ink-900">{compactNum(rows?.length ?? 0)}</p>
            <p className="text-[13px] text-ink-500">Total accounts</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-ink-900">{repeat}</p>
            <p className="text-[13px] text-ink-500">Bought more than once</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-ink-900">
              {money(rows?.length ? Math.round(totalSpend / rows.length) : 0)}
            </p>
            <p className="text-[13px] text-ink-500">Average lifetime value</p>
          </div>
        </Card>
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or city…" className="pl-9" />
            {search ? (
              <button onClick={() => setSearch('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 hover:bg-ink-100">
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex rounded-xl border border-ink-200 p-1">
            {(['spend', 'orders', 'recent', 'name'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[13px] font-semibold capitalize transition',
                  sort === s ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-800',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Table
          columns={columns}
          rows={visible}
          rowKey={(r) => r.user.id}
          loading={rows === null}
          skeletonRows={10}
          emptyTitle="No customers match"
          emptyDescription="Try a different name or email."
        />

        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
          <p className="text-[13px] text-ink-500">
            Showing {visible.length} of {filtered.length}
          </p>
          <Pagination page={safePage} pages={pages} onChange={setPage} />
        </div>
      </Panel>

      <Card className="flex items-start gap-3 p-5">
        <Ban className="mt-0.5 size-4.5 shrink-0 text-ink-400" />
        <p className="text-[13px] leading-relaxed text-ink-600">
          Suspending an account blocks new sign-ins but keeps order history intact for tax and warranty purposes.{' '}
          <Link to="/admin/orders" className="font-semibold text-brand-700 hover:underline">
            Open their orders
          </Link>
          .
        </p>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => listCustomers().then(setRows)}>
          Refresh
        </Button>
      </div>
    </div>
  )
}
