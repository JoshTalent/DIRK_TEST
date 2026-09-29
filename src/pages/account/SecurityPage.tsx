import { useState } from 'react'
import { ShieldCheck, Smartphone, Monitor, Laptop, LogOut, KeyRound, AlertCircle, Check } from 'lucide-react'
import { changePassword } from '@/api/auth'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Button, Card, Field, Input, Switch, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'

export default function SecurityPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessions, setSessions] = useState([
    { id: 's1', device: 'MacBook Pro · Chrome', location: 'Columbus, OH', current: true, last: new Date().toISOString() },
    { id: 's2', device: 'iPhone 16 · Safari', location: 'Columbus, OH', current: false, last: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 's3', device: 'Windows PC · Edge', location: 'Chicago, IL', current: false, last: new Date(Date.now() - 86400000 * 11).toISOString() },
  ])

  if (!user) return null

  const strength = (() => {
    let s = 0
    if (form.next.length >= 8) s++
    if (/[A-Z]/.test(form.next)) s++
    if (/[0-9]/.test(form.next)) s++
    if (/[^A-Za-z0-9]/.test(form.next)) s++
    return s
  })()

  const save = async () => {
    const e: Record<string, string> = {}
    if (!form.current) e.current = 'Enter your current password'
    if (form.next.length < 8) e.next = 'At least 8 characters'
    if (form.next !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    try {
      await changePassword(user.id, form.current, form.next)
      setForm({ current: '', next: '', confirm: '' })
      toast.success('Password updated', 'Other sessions have been signed out.')
    } catch (err) {
      toast.error('Could not update password', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
            <KeyRound className="size-4.5 text-ink-400" />
            <h2 className="text-base font-semibold text-ink-900">Change password</h2>
          </div>
          <div className="space-y-4 p-5">
            <Field label="Current password" required error={errors.current}>
              <Input type="password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
            </Field>
            <Field label="New password" required error={errors.next}>
              <Input type="password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
            </Field>
            {form.next && (
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition',
                      i < strength ? ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'][strength] : 'bg-ink-200',
                    )}
                  />
                ))}
              </div>
            )}
            <Field label="Confirm new password" required error={errors.confirm}>
              <Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            </Field>
            <div className="flex justify-end border-t border-ink-100 pt-4">
              <Button loading={saving} onClick={save}>
                Update password
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
            <ShieldCheck className="size-4.5 text-ink-400" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-ink-900">Two-factor authentication</h2>
              <p className="text-[13px] text-ink-500">Require a one-time code from your authenticator app.</p>
            </div>
            <Switch checked={twoFactor} onChange={(v) => { setTwoFactor(v); toast.success(v ? 'Two-factor enabled' : 'Two-factor disabled') }} />
          </div>
          {twoFactor && (
            <div className="space-y-3 p-5">
              <Field label="Enter the 6-digit code from your app">
                <Input placeholder="000000" inputMode="numeric" maxLength={6} className="w-40 font-mono tracking-[0.3em]" />
              </Field>
              <Button size="sm" icon={<Check className="size-3.5" />}>
                Verify and enable
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
            <Smartphone className="size-4.5 text-ink-400" />
            <h2 className="text-base font-semibold text-ink-900">Active sessions</h2>
          </div>
          <ul className="divide-y divide-ink-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
                  {s.device.includes('iPhone') || s.device.includes('Android') ? (
                    <Smartphone className="size-4" />
                  ) : (
                    <Laptop className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
                    <span className="truncate">{s.device}</span>
                    {s.current && <Badge tone="green">This device</Badge>}
                  </p>
                  <p className="text-xs text-ink-500">
                    {s.location} · {s.current ? 'Active now' : timeAgo(s.last)}
                  </p>
                </div>
                {!s.current && (
                  <button
                    onClick={() => {
                      setSessions((list) => list.filter((x) => x.id !== s.id))
                      toast.info('Session signed out')
                    }}
                    className="text-ink-400 transition hover:text-red-600"
                    aria-label="Sign out session"
                  >
                    <LogOut className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-100 p-4">
            <Button
              variant="outline"
              full
              icon={<Monitor className="size-4" />}
              onClick={() => {
                setSessions((list) => list.filter((s) => s.current))
                toast.info('All other sessions signed out')
              }}
            >
              Sign out everywhere else
            </Button>
          </div>
        </Card>

        <Card className="flex items-start gap-3 p-5">
          <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-ink-400" />
          <div>
            <p className="text-sm font-semibold text-ink-900">Security notices</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
              We will email you if your password changes, a new device signs in, or a large order is placed from your
              account. We will never ask for your password over the phone.
            </p>
          </div>
        </Card>

        <Button variant="ghost" full icon={<LogOut className="size-4" />} onClick={logout}>
          Sign out of this device
        </Button>
      </div>
    </div>
  )
}
