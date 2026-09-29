import { useEffect, useState } from 'react'
import { UserCog, Camera, Check, Trash2 } from 'lucide-react'
import { updateProfile } from '@/api/auth'
import { shortDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Avatar, Button, Card, Field, Input, Switch, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'

const AVATAR_COLORS = ['#1f40e0', '#0f766e', '#b91c1c', '#7c3aed', '#c2410c', '#0891b2', '#be185d', '#4d7c0f']

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    orders: true,
    restocks: true,
    priceDrops: true,
    newsletter: false,
    sms: true,
  })

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, phone: user.phone })
  }, [user])

  if (!user) return null

  const save = async () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (form.phone && form.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number'
    setError(e)
    if (Object.keys(e).length) return

    setSaving(true)
    try {
      const updated = await updateProfile(user.id, form)
      setUser(updated)
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Could not save', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="space-y-5">
        <Card className="p-6 text-center">
          <div className="relative mx-auto w-fit">
            <Avatar name={form.name || user.name} color={user.avatarColor} size={96} />
            <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-ink-900 text-white">
              <Camera className="size-3.5" />
            </span>
          </div>
          <p className="mt-4 text-lg font-bold text-ink-900">{form.name || user.name}</p>
          <p className="text-[13px] text-ink-500">{form.email}</p>
          <Badge className="mt-3">{user.role === 'admin' ? 'Administrator' : 'Customer'}</Badge>
          <p className="mt-4 text-xs text-ink-400">Member since {shortDate(user.createdAt)}</p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">Avatar colour</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setUser({ ...user, avatarColor: c })}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-white transition',
                  user.avatarColor === c ? 'ring-2 ring-ink-900 ring-offset-2' : 'hover:scale-110',
                )}
                style={{ backgroundColor: c }}
                aria-label={`Choose colour ${c}`}
              >
                {user.avatarColor === c && <Check className="size-4" />}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
            <UserCog className="size-4.5 text-ink-400" />
            <h2 className="text-base font-semibold text-ink-900">Personal details</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={error.name}>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email address" required error={error.email}>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>
            <Field label="Mobile number" error={error.phone} hint="Used for delivery updates only">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
              <Button
                variant="ghost"
                onClick={() => setForm({ name: user.name, email: user.email, phone: user.phone })}
              >
                Reset
              </Button>
              <Button loading={saving} onClick={save}>
                Save changes
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-900">Notifications</h2>
            <p className="mt-0.5 text-[13px] text-ink-500">Choose what we are allowed to send you.</p>
          </div>
          <div className="divide-y divide-ink-100 px-5">
            {[
              { key: 'orders' as const, label: 'Order updates', desc: 'Dispatch, out for delivery, delivered' },
              { key: 'restocks' as const, label: 'Back-in-stock alerts', desc: 'Only for items on your wishlist' },
              { key: 'priceDrops' as const, label: 'Price drop alerts', desc: 'When something you saved goes on sale' },
              { key: 'sms' as const, label: 'SMS delivery updates', desc: 'Text me when the courier is 30 minutes away' },
              { key: 'newsletter' as const, label: 'Monthly newsletter', desc: 'New drops and honest post-mortems' },
            ].map((p) => (
              <div key={p.key} className="py-4">
                <Switch
                  checked={prefs[p.key]}
                  onChange={(v) => setPrefs({ ...prefs, [p.key]: v })}
                  label={p.label}
                  description={p.desc}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-red-200">
          <div className="border-b border-red-100 px-5 py-4">
            <h2 className="text-base font-semibold text-red-700">Danger zone</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-semibold text-ink-900">Delete this account</p>
              <p className="text-[13px] text-ink-500">
                Orders are retained for tax purposes; your profile and wishlist are erased immediately.
              </p>
            </div>
            <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => toast.info('Not in this demo', 'Account deletion is disabled.')}>
              Delete account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
