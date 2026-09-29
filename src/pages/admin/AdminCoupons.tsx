import { useEffect, useMemo, useState } from 'react'
import { Plus, Ticket, Copy, Trash2, Pencil, Percent, DollarSign, Truck, CalendarClock } from 'lucide-react'
import { deleteCoupon, getCoupons, saveCoupon } from '@/api/admin'
import { money, shortDate, copyToClipboard } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Coupon, CouponType } from '@/lib/types'
import { Badge, Button, Card, Field, Input, Modal, Select, Switch, Spinner, Textarea } from '@/components/ui'
import { toast } from '@/store/toastStore'

const TYPE_META: Record<CouponType, { label: string; icon: typeof Percent; hint: string }> = {
  percent: { label: 'Percentage off', icon: Percent, hint: 'Value is a percentage, e.g. 20 for 20% off' },
  fixed: { label: 'Fixed amount off', icon: DollarSign, hint: 'Value is a dollar amount' },
  shipping: { label: 'Free shipping', icon: Truck, hint: 'Value is ignored; shipping becomes free' },
}

const blank = (): Coupon => ({
  code: '',
  type: 'percent',
  value: 20,
  minSubtotal: 0,
  active: true,
  expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
  usageLimit: 500,
  usedCount: 0,
  description: '',
})

function normalise(c: Coupon): Coupon {
  return {
    ...c,
    code: c.code.trim().toUpperCase(),
    minSubtotal: Number(c.minSubtotal) || 0,
    value: c.type === 'shipping' ? 0 : Number(c.value) || 0,
    usageLimit: Number(c.usageLimit) || 1,
    description: c.description.trim(),
  }
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<Coupon | null>(null)

  const load = () => getCoupons().then(setCoupons)
  useEffect(() => {
    load()
  }, [])

  const sorted = useMemo(() => {
    if (!coupons) return []
    return [...coupons].sort((a, b) => +new Date(b.expiresAt) - +new Date(a.expiresAt))
  }, [coupons])

  const stats = useMemo(() => {
    const now = Date.now()
    const live = sorted.filter((c) => c.active && +new Date(c.expiresAt) > now)
    return {
      total: sorted.length,
      live: live.length,
      redemptions: sorted.reduce((s, c) => s + c.usedCount, 0),
      expiringSoon: sorted.filter((c) => c.active && +new Date(c.expiresAt) - now < 14 * 86400000).length,
    }
  }, [sorted])

  const save = async () => {
    if (!editing) return
    const e: Record<string, string> = {}
    if (!/^[A-Z0-9-]{3,20}$/.test(editing.code.trim().toUpperCase())) e.code = 'Use 3-20 letters, numbers or dashes'
    if (editing.type === 'percent' && (editing.value <= 0 || editing.value > 90)) e.value = 'Enter a percentage between 1 and 90'
    if (editing.type === 'fixed' && editing.value <= 0) e.value = 'Enter an amount greater than 0'
    if (editing.usageLimit < 1) e.usageLimit = 'At least 1'
    if (editing.usedCount > editing.usageLimit) e.usageLimit = 'Limit is below the number of redemptions'
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true)
    try {
      await saveCoupon(normalise(editing))
      setEditing(null)
      await load()
      toast.success('Coupon saved', editing.code.toUpperCase())
    } catch {
      toast.error('Could not save the coupon')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm) return
    setBusy(true)
    await deleteCoupon(confirm.code)
    setBusy(false)
    setConfirm(null)
    await load()
    toast.success('Coupon deleted', confirm.code)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Coupons</h1>
          <p className="text-[13px] text-ink-500">
            Codes are validated at checkout. A card number ending 0002 always fails so you can test the decline path.
          </p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => setEditing(blank())}>
          New coupon
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total codes', value: stats.total, tone: 'bg-ink-100 text-ink-600' },
          { label: 'Live now', value: stats.live, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Redemptions', value: stats.redemptions, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Expiring < 14 days', value: stats.expiringSoon, tone: 'bg-amber-50 text-amber-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span className={cn('flex size-10 items-center justify-center rounded-xl', s.tone)}>
              <Ticket className="size-5" />
            </span>
            <div>
              <p className="text-xl font-extrabold text-ink-900 tabular-nums">{s.value}</p>
              <p className="text-[13px] text-ink-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {coupons === null ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-7 text-brand-600" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((c) => {
            const expired = +new Date(c.expiresAt) < Date.now()
            const exhausted = c.usedCount >= c.usageLimit
            const Meta = TYPE_META[c.type].icon
            return (
              <Card key={c.code} className={cn('flex flex-col p-5', (!c.active || expired || exhausted) && 'opacity-70')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Meta className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <button
                        onClick={() => {
                          copyToClipboard(c.code)
                          toast.info('Code copied', c.code)
                        }}
                        className="font-mono text-sm font-bold text-ink-900 hover:text-brand-700"
                        title="Copy code"
                      >
                        {c.code}
                      </button>
                      <p className="truncate text-xs text-ink-500">{c.description || 'No description'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(c.code)}
                    className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                    title="Copy"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge tone={c.active && !expired ? 'green' : 'red'}>
                    {!c.active ? 'Inactive' : expired ? 'Expired' : exhausted ? 'Used up' : 'Live'}
                  </Badge>
                  <Badge tone="neutral">{TYPE_META[c.type].label}</Badge>
                  {c.minSubtotal > 0 ? <Badge tone="amber">Min {money(c.minSubtotal)}</Badge> : null}
                </div>

                <p className="mt-4 text-2xl font-extrabold text-ink-900">
                  {c.type === 'percent' ? `${c.value}% off` : c.type === 'fixed' ? `${money(c.value)} off` : 'Free shipping'}
                </p>

                <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Used</span>
                    <span className="font-medium text-ink-900 tabular-nums">
                      {c.usedCount} / {c.usageLimit}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
                    />
                  </div>
                  <p className="flex items-center gap-1.5 pt-1 text-xs text-ink-500">
                    <CalendarClock className="size-3.5" />
                    {expired ? 'Expired' : 'Expires'} {shortDate(c.expiresAt)}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" full icon={<Pencil className="size-3.5" />} onClick={() => setEditing(c)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="size-3.5" />}
                    className="text-red-600"
                    onClick={() => setConfirm(c)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={coupons?.some((c) => c.code === editing?.code) ? 'Edit coupon' : 'New coupon'}
        description="Codes are matched case-insensitively at checkout."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={save}>
              Save coupon
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" required error={errors.code}>
                <Input
                  className="font-mono uppercase"
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME20"
                />
              </Field>
              <Field label="Type">
                <Select
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value as CouponType })}
                >
                  {(Object.keys(TYPE_META) as CouponType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_META[t].label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {editing.type !== 'shipping' ? (
                <Field label="Value" required error={errors.value} hint={TYPE_META[editing.type].hint}>
                  <Input
                    type="number"
                    min="0"
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                  />
                </Field>
              ) : null}
              <Field label="Minimum subtotal">
                <Input
                  type="number"
                  min="0"
                  value={editing.minSubtotal}
                  onChange={(e) => setEditing({ ...editing, minSubtotal: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Usage limit" required error={errors.usageLimit}>
                <Input
                  type="number"
                  min="1"
                  value={editing.usageLimit}
                  onChange={(e) => setEditing({ ...editing, usageLimit: Number(e.target.value) })}
                />
              </Field>
              <Field label="Expires" required>
                <Input
                  type="date"
                  value={editing.expiresAt.slice(0, 10)}
                  onChange={(e) => setEditing({ ...editing, expiresAt: new Date(`${e.target.value}T23:59:59`).toISOString() })}
                />
              </Field>
            </div>
            <Field label="Description" hint="Shown to the customer in the cart">
              <Textarea
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="20% off your first order over RWF 100"
              />
            </Field>
            <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
              <Switch
                checked={editing.active}
                onChange={(v) => setEditing({ ...editing, active: v })}
                label="Active"
                description="Inactive codes are rejected at checkout."
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete this coupon?"
        description={`${confirm?.code} will stop working immediately. Orders that already used it keep their discount.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete coupon
            </Button>
          </>
        }
      />
    </div>
  )
}
