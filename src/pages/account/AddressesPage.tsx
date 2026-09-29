import { useState } from 'react'
import { MapPin, Plus, Trash2, Star, Check } from 'lucide-react'
import { addAddress, removeAddress, setDefaultAddress } from '@/api/auth'
import { cn } from '@/lib/cn'
import { Button, Card, EmptyState, Field, Input, Modal, Select, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import type { Address } from '@/lib/types'

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Netherlands', 'Australia', 'Japan']

const blank = (name: string, phone: string): Omit<Address, 'id'> => ({
  label: 'Home',
  fullName: name,
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
  phone,
  isDefault: false,
})

export default function AddressesPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [editing, setEditing] = useState<Omit<Address, 'id'> | null>(null)
  const [busy, setBusy] = useState(false)

  if (!user) return null

  const save = async () => {
    if (!editing) return
    setBusy(true)
    const updated = await addAddress(user.id, editing)
    setUser(updated)
    setEditing(null)
    setBusy(false)
    toast.success('Address saved', editing.line1)
  }

  const act = async (fn: () => Promise<typeof user>, message: string) => {
    const updated = await fn()
    if (updated) setUser(updated)
    toast.success(message)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-ink-900">Saved addresses</p>
          <p className="text-[13px] text-ink-500">Used to speed up checkout and label returns.</p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => setEditing(blank(user.name, user.phone))}>
          Add address
        </Button>
      </div>

      {user.addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-6" />}
          title="No saved addresses"
          description="Add one now and checkout becomes a two-click process."
          action={<Button onClick={() => setEditing(blank(user.name, user.phone))}>Add your first address</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {user.addresses.map((a) => (
            <Card key={a.id} className={cn('relative p-5', a.isDefault && 'border-brand-300 ring-1 ring-brand-200')}>
              {a.isDefault && (
                <Badge tone="brand" className="absolute top-4 right-4">
                  <Check className="size-3" /> Default
                </Badge>
              )}
              <p className="text-sm font-semibold text-ink-900">{a.label}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 && (
                  <>
                    <br />
                    {a.line2}
                  </>
                )}
                <br />
                {a.city}, {a.state} {a.zip}
                <br />
                {a.country}
                <br />
                <span className="text-ink-500">{a.phone}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
                <Button variant="outline" size="sm" icon={<MapPin className="size-3.5" />} onClick={() => setEditing(a)}>
                  Edit
                </Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" icon={<Star className="size-3.5" />} onClick={() => act(() => setDefaultAddress(user.id, a.id), 'Default address updated')}>
                    Make default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="size-3.5" />}
                  className="text-red-600"
                  onClick={() => act(() => removeAddress(user.id, a.id), 'Address removed')}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="flex items-start gap-3 p-5">
        <MapPin className="mt-0.5 size-4.5 shrink-0 text-ink-400" />
        <div>
          <p className="text-sm font-semibold text-ink-900">Shipping coverage</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
            We deliver to 34 countries. Duties are calculated at checkout for international orders so nothing is owed on
            delivery. Remote-area surcharges are shown before you pay.
          </p>
        </div>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={user.addresses.some((a) => a.label === editing?.label && a.line1 === editing?.line1) ? 'Add address' : 'Edit address'}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={busy} disabled={!editing?.line1 || !editing?.city} onClick={save}>
              Save address
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Label" required>
                <Select value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })}>
                  {['Home', 'Work', 'Other'].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Full name" required>
                <Input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
              </Field>
            </div>
            <Field label="Street address" required>
              <Input value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} />
            </Field>
            <Field label="Apartment, suite, etc.">
              <Input value={editing.line2} onChange={(e) => setEditing({ ...editing, line2: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" required>
                <Input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </Field>
              <Field label="State / Region" required>
                <Input value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} />
              </Field>
              <Field label="ZIP / Postcode" required>
                <Input value={editing.zip} onChange={(e) => setEditing({ ...editing, zip: e.target.value })} />
              </Field>
            </div>
            <Field label="Country">
              <Select value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Phone" required>
              <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2.5 text-[13px] text-ink-700">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                className="size-[18px] rounded-[6px] accent-brand-600"
              />
              Set as my default delivery address
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}
