import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Lock,
  CreditCard,
  Truck,
  Wallet,
  Building2,
  Banknote,
  Check,
  ChevronLeft,
  ShieldCheck,
  MapPin,
  Plus,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { placeOrder, FREE_SHIPPING_THRESHOLD } from '@/api/orders'
import type { Address, PaymentMethod } from '@/lib/types'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, Field, Input, Select, Modal, Checkbox } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { products as allProducts } from '@/data/catalog'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Logo } from '@/components/layout/Logo'
import { toast } from '@/store/toastStore'

type Step = 'information' | 'shipping' | 'payment'

const STEPS: { key: Step; label: string; icon: typeof MapPin }[] = [
  { key: 'information', label: 'Information', icon: MapPin },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'payment', label: 'Payment', icon: CreditCard },
]

const PAYMENT_METHODS: { key: PaymentMethod; label: string; sub: string; icon: typeof CreditCard }[] = [
  { key: 'card', label: 'Card', sub: 'Visa, Mastercard, Amex — 2.9% + 30¢', icon: CreditCard },
  { key: 'paypal', label: 'PayPal', sub: 'Redirects to PayPal on submit', icon: Wallet },
  { key: 'bank', label: 'Bank transfer', sub: 'Ships when the transfer clears', icon: Building2 },
  { key: 'cod', label: 'Cash on delivery', sub: '+RWF 4 handling fee', icon: Banknote },
]

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Netherlands', 'Australia', 'Japan']

function formatCardNumber(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const lines = useCartStore((s) => s.lines)
  const coupon = useCartStore((s) => s.coupon)
  const shippingMethod = useCartStore((s) => s.shippingMethod)
  const setShippingMethod = useCartStore((s) => s.setShippingMethod)
  const clear = useCartStore((s) => s.clear)
  const totals = useCartStore((s) => s.totals)()

  const [step, setStep] = useState<Step>('information')
  const [address, setAddress] = useState({
    label: 'Home',
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    line1: user?.addresses[0]?.line1 ?? '',
    line2: user?.addresses[0]?.line2 ?? '',
    city: user?.addresses[0]?.city ?? '',
    state: user?.addresses[0]?.state ?? '',
    zip: user?.addresses[0]?.zip ?? '',
    country: user?.addresses[0]?.country ?? 'United States',
  })
  const [saveAddress, setSaveAddress] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [addressPicker, setAddressPicker] = useState(false)
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    label: 'Home',
    fullName: user?.name ?? '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: user?.phone ?? '',
    isDefault: false,
  })

  const productMap = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [])
  const rows = lines
    .map((line) => ({ line, product: productMap.get(line.productId) }))
    .filter((r): r is { line: (typeof lines)[number]; product: (typeof allProducts)[number] } => Boolean(r.product))

  const codFee = method === 'cod' ? 4 : 0
  const grandTotal = totals.total + codFee

  if (!rows.length) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Your bag is empty</h1>
        <p className="mt-2 text-ink-500">Add something to the bag before checking out.</p>
        <Button className="mt-6" onClick={() => navigate('/shop')}>
          Browse the catalogue
        </Button>
      </div>
    )
  }

  const validateInformation = () => {
    const e: Record<string, string> = {}
    if (!address.fullName.trim()) e.fullName = 'Required'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address.email)) e.email = 'Enter a valid email'
    if (address.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number'
    if (!address.line1.trim()) e.line1 = 'Required'
    if (!address.city.trim()) e.city = 'Required'
    if (!address.state.trim()) e.state = 'Required'
    if (address.zip.trim().length < 3) e.zip = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validatePayment = () => {
    if (method !== 'card') return true
    const e: Record<string, string> = {}
    if (card.number.replace(/\D/g, '').length < 15) e.number = 'Enter a valid card number'
    if (!card.name.trim()) e.name = 'Required'
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'Use MM/YY'
    if (card.cvc.length < 3) e.cvc = '3 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step === 'information' && !validateInformation()) {
      toast.error('Check your details', 'A few highlighted fields need attention.')
      return
    }
    setErrors({})
    setStep(step === 'information' ? 'shipping' : 'payment')
  }

  const submit = async () => {
    if (!validatePayment()) {
      toast.error('Check your payment details')
      return
    }
    setSubmitting(true)
    try {
      const order = await placeOrder({
        userId: user?.id ?? null,
        email: address.email,
        lines,
        couponCode: coupon?.code ?? null,
        address: {
          label: address.label,
          fullName: address.fullName,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
          phone: address.phone,
        },
        shippingMethod,
        paymentMethod: method,
        card,
      })
      clear()
      toast.success('Payment approved', `Order ${order.number} is confirmed.`)
      navigate(`/checkout/confirmation/${order.number}`, { replace: true })
    } catch (err) {
      toast.error('We could not complete that order', err instanceof Error ? err.message : 'Please try again.')
      setSubmitting(false)
    }
  }

  const expressEta = new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const standardEta = new Date(Date.now() + 6 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2 text-[13px] text-ink-500">
            <Lock className="size-3.5" /> Secure checkout
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <div>
          <ol className="mb-8 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const activeIndex = STEPS.findIndex((x) => x.key === step)
              const done = i < activeIndex
              return (
                <li key={s.key} className="flex flex-1 items-center gap-2">
                  <button
                    onClick={() => done && setStep(s.key)}
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition',
                      done
                        ? 'bg-emerald-500 text-white'
                        : step === s.key
                          ? 'bg-ink-900 text-white'
                          : 'bg-ink-200 text-ink-500',
                    )}
                  >
                    {done ? <Check className="size-4" /> : i + 1}
                  </button>
                  <span className={cn('hidden text-[13px] font-medium sm:block', step === s.key ? 'text-ink-900' : 'text-ink-500')}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && <span className="h-px flex-1 bg-ink-200" />}
                </li>
              )
            })}
          </ol>

          {step === 'information' && (
            <div className="animate-fade-up">
              <h1 className="text-xl font-bold text-ink-900">Contact & delivery</h1>

              {user && user.addresses.length > 0 && (
                <div className="mt-5">
                  <p className="text-[13px] font-semibold text-ink-700">Saved addresses</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {user.addresses.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setAddressPicker(false)
                          setAddress({
                            label: a.label,
                            fullName: a.fullName,
                            email: address.email,
                            phone: a.phone,
                            line1: a.line1,
                            line2: a.line2 ?? '',
                            city: a.city,
                            state: a.state,
                            zip: a.zip,
                            country: a.country,
                          })
                        }}
                        className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5 text-left transition hover:border-ink-400"
                      >
                        <MapPin className="mt-0.5 size-4 shrink-0 text-ink-400" />
                        <div className="min-w-0 text-[13px]">
                          <p className="flex items-center gap-2 font-semibold text-ink-900">
                            {a.label}
                            {a.isDefault && <Badge tone="brand">Default</Badge>}
                          </p>
                          <p className="mt-0.5 text-ink-500">
                            {a.line1}, {a.city} {a.state} {a.zip}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Card className="mt-5 space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" required error={errors.email}>
                    <Input type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} />
                  </Field>
                  <Field label="Full name" required error={errors.fullName}>
                    <Input value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                  </Field>
                </div>
                <Field label="Phone" required error={errors.phone} hint="The courier may call before delivery">
                  <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                </Field>
                <Field label="Street address" required error={errors.line1}>
                  <Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="2140 Alum Creek Dr" />
                </Field>
                <Field label="Apartment, suite, etc.">
                  <Input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" required error={errors.city}>
                    <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  </Field>
                  <Field label="State / Region" required error={errors.state}>
                    <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  </Field>
                  <Field label="ZIP / Postcode" required error={errors.zip}>
                    <Input value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
                  </Field>
                </div>
                <Field label="Country">
                  <Select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>

                {user && (
                  <div className="flex flex-wrap items-center gap-4 border-t border-ink-100 pt-4">
                    <Checkbox checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} label="Save this address to my account" />
                    <Button type="button" variant="ghost" size="sm" icon={<Plus className="size-3.5" />} onClick={() => setAddressPicker(true)}>
                      Add another address
                    </Button>
                  </div>
                )}
              </Card>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/cart" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-medium text-ink-600 hover:bg-ink-100">
                  <ChevronLeft className="size-4" /> Back to bag
                </Link>
                <Button className="sm:flex-1" onClick={next}>
                  Continue to shipping
                </Button>
              </div>
            </div>
          )}

          {step === 'shipping' && (
            <div className="animate-fade-up">
              <h1 className="text-xl font-bold text-ink-900">Shipping method</h1>
              <div className="mt-5 space-y-3">
                {[
                  {
                    key: 'standard' as const,
                    title: 'Standard delivery',
                    eta: standardEta,
                    price: totals.shipping === 0 ? 0 : totals.shipping,
                    sub: 'Northline Freight · signature on delivery',
                  },
                  {
                    key: 'express' as const,
                    title: 'Express delivery',
                    eta: expressEta,
                    price: (totals.shipping === 0 ? 0 : totals.shipping) + 14.5,
                    sub: 'Priority air · tracked end to end',
                  },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setShippingMethod(m.key)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition',
                      shippingMethod === m.key ? 'border-ink-900' : 'border-ink-200 hover:border-ink-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        shippingMethod === m.key ? 'border-ink-900 bg-ink-900' : 'border-ink-300',
                      )}
                    >
                      {shippingMethod === m.key && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{m.title}</p>
                      <p className="text-[13px] text-ink-500">Arrives {m.eta} · {m.sub}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900">
                      {m.price === 0 ? 'Free' : money(m.price)}
                    </span>
                  </button>
                ))}
              </div>

              <Card className="mt-5 p-5">
                <h2 className="text-sm font-semibold text-ink-900">Delivering to</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
                  {address.fullName} · {address.line1}
                  {address.line2 && `, ${address.line2}`}, {address.city}, {address.state} {address.zip}, {address.country}
                </p>
                <button onClick={() => setStep('information')} className="mt-2 text-[13px] font-semibold text-brand-700 hover:underline">
                  Edit address
                </button>
              </Card>

              {totals.subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-800 ring-1 ring-amber-200 ring-inset">
                  <AlertCircle className="size-4 shrink-0" />
                  Spend {money(FREE_SHIPPING_THRESHOLD - totals.subtotal)} more to unlock free shipping.
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button variant="ghost" onClick={() => setStep('information')} icon={<ChevronLeft className="size-4" />}>
                  Back
                </Button>
                <Button className="sm:flex-1" onClick={() => setStep('payment')}>
                  Continue to payment
                </Button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="animate-fade-up">
              <h1 className="text-xl font-bold text-ink-900">Payment</h1>
              <p className="mt-1 text-[13px] text-ink-500">All transactions are encrypted. This demo never contacts a real payment network.</p>

              <div className="mt-5 space-y-3">
                {PAYMENT_METHODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setMethod(p.key)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition',
                      method === p.key ? 'border-ink-900' : 'border-ink-200 hover:border-ink-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        method === p.key ? 'border-ink-900 bg-ink-900' : 'border-ink-300',
                      )}
                    >
                      {method === p.key && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    <p.icon className="size-5 text-ink-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{p.label}</p>
                      <p className="text-[13px] text-ink-500">{p.sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              {method === 'card' && (
                <Card className="mt-5 space-y-4 p-5">
                  <Field label="Card number" required error={errors.number}>
                    <Input
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Name on card" required error={errors.name}>
                    <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry" required error={errors.expiry}>
                      <Input
                        value={card.expiry}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCard({ ...card, expiry: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v })
                        }}
                        placeholder="MM/YY"
                      />
                    </Field>
                    <Field label="CVC" required error={errors.cvc}>
                      <Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" />
                    </Field>
                  </div>
                  <p className="rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
                    Demo tip: any number ending <span className="font-mono font-semibold">0002</span> simulates a declined
                    card. Everything else is approved.
                  </p>
                </Card>
              )}

              {method === 'cod' && (
                <Card className="mt-5 p-5 text-[13px] text-ink-600">
                  <p className="font-semibold text-ink-900">Pay the courier on delivery</p>
                  <p className="mt-1.5">
                    An RWF 4 handling fee is added at checkout. Please have the exact amount ready — most drivers cannot
                    make change on the doorstep.
                  </p>
                </Card>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button variant="ghost" onClick={() => setStep('shipping')} icon={<ChevronLeft className="size-4" />}>
                  Back
                </Button>
                <Button
                  className="sm:flex-1"
                  size="lg"
                  loading={submitting}
                  onClick={submit}
                  icon={submitting ? undefined : <Lock className="size-4" />}
                >
                  {submitting ? 'Authorising payment…' : `Pay ${money(grandTotal)}`}
                </Button>
              </div>

              {submitting && (
                <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-ink-500">
                  <Loader2 className="size-3.5 animate-spin" /> Talking to the payment gateway…
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h2 className="text-base font-semibold text-ink-900">Order summary</h2>
            </div>
            <ul className="max-h-72 divide-y divide-ink-100 overflow-y-auto">
              {rows.map(({ line, product }) => (
                <li key={`${line.productId}-${line.color}`} className="flex items-center gap-3 p-4">
                  <div className="relative shrink-0">
                    <ProductImage product={product} selectedColor={line.color} className="size-14 rounded-lg" iconSize="sm" />
                    <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                      {line.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink-900">{product.name}</p>
                    <p className="text-xs text-ink-500">{product.brand}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-ink-900">{money(product.price * line.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2.5 border-t border-ink-100 p-5 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="font-medium">{money(totals.subtotal)}</span></div>
              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Discount {coupon?.code && <span className="text-emerald-600">({coupon.code})</span>}</span>
                  <span className="font-medium text-emerald-600">− {money(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-500">Shipping</span>
                <span className="font-medium">{totals.shipping === 0 ? 'Free' : money(totals.shipping)}</span>
              </div>
              <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="font-medium">{money(totals.tax)}</span></div>
              {codFee > 0 && <div className="flex justify-between"><span className="text-ink-500">COD handling</span><span className="font-medium">{money(codFee)}</span></div>}
            </div>

            <div className="flex items-baseline justify-between border-t border-ink-200 bg-ink-50/60 px-5 py-4">
              <span className="text-sm font-semibold text-ink-900">Total</span>
              <span className="text-2xl font-extrabold text-ink-900">{money(grandTotal)}</span>
            </div>

            <div className="space-y-2 border-t border-ink-100 p-5 text-xs text-ink-500">
              <p className="flex items-center gap-2"><ShieldCheck className="size-3.5" /> PCI-DSS compliant checkout</p>
              <p className="flex items-center gap-2"><Truck className="size-3.5" /> Free returns within 30 days</p>
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={addressPicker}
        onClose={() => setAddressPicker(false)}
        title="Add a new address"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddressPicker(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setAddress({
                  label: newAddress.label,
                  fullName: newAddress.fullName,
                  email: address.email,
                  phone: newAddress.phone,
                  line1: newAddress.line1,
                  line2: newAddress.line2 ?? '',
                  city: newAddress.city,
                  state: newAddress.state,
                  zip: newAddress.zip,
                  country: newAddress.country,
                })
                setAddressPicker(false)
                toast.success('Address added', 'Saved to this order. Save it to your account from the previous step.')
              }}
            >
              Use this address
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <Input value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Street address" required>
            <Input value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
          </Field>
          <Field label="Apartment, suite, etc.">
            <Input value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" required>
              <Input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
            </Field>
            <Field label="State" required>
              <Input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
            </Field>
            <Field label="ZIP" required>
              <Input value={newAddress.zip} onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })} />
            </Field>
          </div>
          <Field label="Country">
            <Select value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
