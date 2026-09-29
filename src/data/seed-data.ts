import { makeRng } from '@/lib/seed'
import { categories, products } from './catalog'
import type { Coupon, Order, OrderEvent, OrderItem, Review, User } from '@/lib/types'

const rng = makeRng(20260214)

const FIRST = ['Maya', 'Noah', 'Ava', 'Liam', 'Sofia', 'Ethan', 'Zoe', 'Milo', 'Iris', 'Theo', 'Nina', 'Owen', 'Lena', 'Hugo', 'Ruby', 'Jonas', 'Cleo', 'Arlo', 'Maya', 'Felix', 'Anya', 'Dario', 'Priya', 'Sam', 'Yara', 'Kai', 'Tessa', 'Bruno', 'Ines', 'Ravi', 'Elsa', 'Marco', 'Faye', 'Nico', 'Alma', 'Ravi', 'Tobias', 'June', 'Amara', 'Leo']
const LAST = ['Reyes', 'Novak', 'Haddad', 'Lindqvist', 'Okafor', 'Moreau', 'Silva', 'Bauer', 'Kaur', 'Whitfield', 'Tanaka', 'Duarte', 'Ferreira', 'Nilsson', 'Costa', 'Abadi', 'Kowalski', 'Mensah', 'Petrov', 'Ibrahim', 'Larsen', 'Romero', 'Vega', 'Holt']

const STREETS = ['Alder Street', 'Kestrel Lane', 'Marlow Road', 'Fenwick Avenue', 'Halden Row', 'Portside Way', 'Copper Lane', 'Ivory Boulevard', 'Slate Court', 'Wren Terrace']
const CITIES: [string, string, string][] = [
  ['Portland', 'OR', '97209'],
  ['Austin', 'TX', '78704'],
  ['Denver', 'CO', '80206'],
  ['Chicago', 'IL', '60622'],
  ['Brooklyn', 'NY', '11249'],
  ['Seattle', 'WA', '98109'],
  ['Phoenix', 'AZ', '85004'],
  ['Nashville', 'TN', '37206'],
  ['San Diego', 'CA', '92101'],
  ['Boulder', 'CO', '80302'],
  ['Savannah', 'GA', '31401'],
  ['Providence', 'RI', '02903'],
]
const AVATAR_COLORS = ['#1f40e0', '#0f766e', '#b91c1c', '#7c3aed', '#c2410c', '#0891b2', '#be185d', '#4d7c0f']

const pad = (n: number) => String(n).padStart(2, '0')

function makeAddress(fullName: string) {
  const [city, state, zip] = rng.pick(CITIES)
  return {
    fullName,
    line1: `${rng.int(12, 9800)} ${rng.pick(STREETS)}`,
    line2: rng.bool(0.3) ? `Apt ${rng.int(2, 24)}${rng.pick(['A', 'B', 'C'])}` : '',
    city,
    state,
    zip,
    country: 'United States',
    phone: `+1 (${rng.int(201, 989)}) ${rng.int(200, 999)}-${pad(rng.int(0, 9999))}`,
  }
}

function makeUsers(): User[] {
  const seen = new Set<string>()
  const customers: User[] = []
  const DAY = 86400000

  for (let i = 0; i < 34; i++) {
    const name = `${rng.pick(FIRST)} ${rng.pick(LAST)}`
    let email = name.toLowerCase().replace(/[^a-z]+/g, '.') + '@' + rng.pick(['mailbox.com', 'postbox.io', 'inboxly.net', 'corriere.dev'])
    let n = 2
    while (seen.has(email)) email = email.replace('@', `${n++}@`)
    seen.add(email)

    customers.push({
      id: `u-${pad(i + 1)}`,
      name,
      email,
      password: 'demo1234',
      role: 'customer',
      phone: makeAddress(name).phone,
      createdAt: new Date(Date.now() - rng.int(5, 900) * DAY).toISOString(),
      status: rng.bool(0.05) ? 'suspended' : 'active',
      addresses: [makeAddress(name), ...(rng.bool(0.35) ? [makeAddress(name)] : [])].map((a, idx) => ({
        id: `a-${i}-${idx}`,
        label: idx === 0 ? 'Home' : 'Work',
        isDefault: idx === 0,
        ...a,
      })),
      avatarColor: rng.pick(AVATAR_COLORS),
    })
  }

  const demoAddress = makeAddress('Demo Customer')
  const demoCustomer: User = {
    id: 'u-demo',
    name: 'Demo Customer',
    email: 'customer@demo.com',
    password: 'demo1234',
    role: 'customer',
    phone: demoAddress.phone,
    createdAt: new Date(Date.now() - 120 * DAY).toISOString(),
    status: 'active',
    avatarColor: '#1f40e0',
    addresses: [
      { id: 'a-demo-1', label: 'Home', isDefault: true, ...demoAddress },
      { id: 'a-demo-2', label: 'Office', isDefault: false, ...makeAddress('Demo Customer') },
    ],
  }

  const admin: User = {
    id: 'u-admin',
    name: 'Ada Marchetti',
    email: 'admin@demo.com',
    password: 'admin1234',
    role: 'admin',
    phone: makeAddress('Ada Marchetti').phone,
    createdAt: new Date(Date.now() - 700 * DAY).toISOString(),
    status: 'active',
    avatarColor: '#0f766e',
    addresses: [],
  }

  return [admin, demoCustomer, ...customers]
}

const COUPONS: Coupon[] = [
  { code: 'WELCOME15', type: 'percent', value: 15, minSubtotal: 0, active: true, expiresAt: offset(120), usageLimit: 1000, usedCount: 0, description: '15% off your first order' },
  { code: 'SAVE25', type: 'fixed', value: 25, minSubtotal: 150, active: true, expiresAt: offset(45), usageLimit: 500, usedCount: 0, description: 'RWF 25 off orders over RWF 150' },
  { code: 'FREESHIP', type: 'shipping', value: 0, minSubtotal: 0, active: true, expiresAt: offset(200), usageLimit: 5000, usedCount: 0, description: 'Free standard shipping, any order' },
  { code: 'AUDIO20', type: 'percent', value: 20, minSubtotal: 200, active: true, expiresAt: offset(30), usageLimit: 200, usedCount: 0, description: '20% off Audio over RWF 200' },
  { code: 'SPRING30', type: 'percent', value: 30, minSubtotal: 400, active: false, expiresAt: offset(-10), usageLimit: 300, usedCount: 0, description: 'Expired spring promo' },
]

function offset(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString()
}

const REVIEW_TITLES_POS = ['Exactly what I hoped for', 'Worth every cent', 'Better than expected', 'Impressive build quality', 'My new daily driver', 'Great value', 'Solid and quiet', 'Replaced three of them']
const REVIEW_TITLES_MID = ['Good, with one caveat', 'Solid but pricey', 'Does the job', 'Happy overall', 'Nearly perfect']
const REVIEW_TITLES_NEG = ['Not for me', 'Stopped working after a month', 'Overpriced for the build', 'Return shipped, will buy elsewhere']
const REVIEW_BODIES = [
  'Arrived two days early and the packaging was excellent. I have been using it daily and it has handled everything I have thrown at it.',
  'The soundstage is wider than I expected and the low end is tight rather than boomy. Battery life matches the spec almost exactly.',
  'Build quality is the standout here. It feels like something twice the price, and the software is uncluttered.',
  'I compared three options before settling on this and it was the right call. Only wish the cable was a bit longer.',
  'Support answered my question in under an hour on a weekend, which honestly impressed me more than the product.',
  'Does exactly what it says. It is not the most feature rich option, but everything it does, it does well.',
  'Had to return the first unit, the replacement arrived in a day. Second unit has been flawless for three weeks.',
  'It is good, not great. If you can find it on sale the value jumps a lot.',
]

const PAYMENT_METHODS = ['card', 'card', 'card', 'paypal', 'cod', 'bank'] as const

function makeOrders(users: User[]): Order[] {
  const customers = users.filter((u) => u.role === 'customer')
  const orders: Order[] = []
  const DAY = 86400000
  const guestNames = customers.slice(0, 8).map((u) => u.name)

  for (let i = 0; i < 168; i++) {
    // Bias toward recent days so revenue trends upward on the chart.
    const daysAgo = Math.floor(Math.pow(rng.next(), 1.9) * 240)
    const placedAt = new Date(Date.now() - daysAgo * DAY - rng.int(0, 86399) * 1000)
    const user = customers[rng.int(0, customers.length - 1)]
    const isGuest = rng.bool(0.06)
    const customerName = isGuest ? rng.pick(guestNames) : user.name
    const customerEmail = isGuest ? `guest.${rng.int(100, 999)}@example.com` : user.email
    const addrSource = isGuest ? makeAddress(customerName) : rng.pick(user.addresses)

    const lineCount = daysAgo > 120 ? rng.int(1, 3) : rng.int(1, 5)
    const picked = new Map<string, OrderItem>()
    for (let l = 0; l < lineCount; l++) {
      const p = rng.pick(products)
      if (p.status !== 'active') continue
      const color = rng.pick(p.colors)
      const key = `${p.id}-${color}`
      const existing = picked.get(key)
      if (existing) existing.qty = Math.min(5, existing.qty + 1)
      else picked.set(key, { productId: p.id, name: p.name, brand: p.brand, color, price: p.price, qty: rng.int(1, 3) })
    }
    const items = [...picked.values()]
    if (!items.length) continue

    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
    const coupon = rng.bool(0.28) ? rng.pick(COUPONS.filter((c) => c.active)) : null
    const discount = coupon
      ? coupon.type === 'percent'
        ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
        : coupon.type === 'fixed'
          ? Math.min(coupon.value, subtotal)
          : 0
      : 0
    const freeShip = subtotal >= 99 || coupon?.type === 'shipping'
    const shipping = freeShip ? 0 : 12.95
    const tax = Math.round(Math.max(0, subtotal - discount) * 0.0825 * 100) / 100
    const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100

    const ageDays = daysAgo
    let status: Order['status']
    if (ageDays > 30) status = rng.bool(0.08) ? 'refunded' : rng.bool(0.06) ? 'cancelled' : 'delivered'
    else if (ageDays > 12) status = rng.bool(0.85) ? 'delivered' : 'refunded'
    else if (ageDays > 5) status = rng.bool(0.6) ? 'shipped' : 'delivered'
    else if (ageDays > 2) status = rng.bool(0.55) ? 'processing' : 'shipped'
    else status = rng.bool(0.72) ? 'pending' : 'processing'

    if (status === 'cancelled' || status === 'refunded') coupon && (coupon.usedCount += 1)
    else if (coupon) coupon.usedCount += 1

    const paymentStatus: Order['paymentStatus'] =
      status === 'refunded' ? 'refunded' : status === 'cancelled' ? (rng.bool(0.5) ? 'refunded' : 'failed') : 'paid'
    const method = rng.pick(PAYMENT_METHODS)
    const paymentStatusFinal = method === 'cod' ? (status === 'delivered' ? 'paid' : 'unpaid') : paymentStatus

    const timeline: OrderEvent[] = [{ label: 'Order placed', at: placedAt.toISOString() }]
    if (paymentStatusFinal === 'paid') {
      timeline.push({ label: 'Payment confirmed', at: new Date(placedAt.getTime() + rng.int(2, 300) * 1000).toISOString() })
    }
    if (['processing', 'shipped', 'delivered', 'refunded'].includes(status)) {
      timeline.push({ label: 'Payment captured', at: new Date(placedAt.getTime() + rng.int(400, 4200) * 1000).toISOString(), note: 'Warehouse released the order' })
    }
    if (['shipped', 'delivered', 'refunded'].includes(status)) {
      timeline.push({ label: 'Shipped', at: new Date(placedAt.getTime() + rng.int(1, 3) * DAY).toISOString(), note: 'Carrier: Northline Freight' })
    }
    if (['delivered', 'refunded'].includes(status)) {
      timeline.push({ label: 'Delivered', at: new Date(placedAt.getTime() + rng.int(3, 7) * DAY).toISOString() })
    }
    if (status === 'refunded') {
      timeline.push({ label: 'Refunded', at: new Date(placedAt.getTime() + rng.int(8, 14) * DAY).toISOString(), note: 'Returned to original payment method' })
    }
    if (status === 'cancelled') {
      timeline.push({ label: 'Cancelled', at: new Date(placedAt.getTime() + rng.int(1, 2) * DAY).toISOString() })
    }

    orders.push({
      id: `o-${10000 + i}`,
      number: `AU-${pad(10000 + i)}`,
      userId: isGuest ? null : user.id,
      customerName,
      customerEmail,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      shipping,
      tax,
      total,
      status,
      paymentStatus: paymentStatusFinal,
      paymentMethod: method,
      couponCode: coupon && discount > 0 ? coupon.code : coupon?.type === 'shipping' ? coupon.code : null,
      address: {
        fullName: addrSource.fullName,
        line1: addrSource.line1,
        line2: addrSource.line2,
        city: addrSource.city,
        state: addrSource.state,
        zip: addrSource.zip,
        country: addrSource.country,
        phone: addrSource.phone,
      },
      placedAt: placedAt.toISOString(),
      timeline,
    })
  }

  return orders.sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt))
}

function makeReviews(users: User[]): Review[] {
  const customers = users.filter((u) => u.role === 'customer')
  const reviews: Review[] = []
  const active = products.filter((p) => p.status === 'active')
  let n = 0

  for (const p of active) {
    const count = Math.max(3, Math.round(p.reviewCount / 26))
    for (let i = 0; i < count; i++) {
      const u = customers[rng.int(0, customers.length - 1)]
      const r = rng.next()
      const rating = r < 0.58 ? 5 : r < 0.8 ? 4 : r < 0.92 ? 3 : r < 0.98 ? 2 : 1
      const daysAgo = rng.int(1, 420)
      reviews.push({
        id: `r-${pad(++n)}`,
        productId: p.id,
        userId: u.id,
        userName: u.name,
        rating,
        title: rating >= 4 ? rng.pick(REVIEW_TITLES_POS) : rating === 3 ? rng.pick(REVIEW_TITLES_MID) : rng.pick(REVIEW_TITLES_NEG),
        body: rng.pick(REVIEW_BODIES),
        createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        status: daysAgo < 21 && rng.bool(0.4) ? 'pending' : rng.bool(0.04) ? 'rejected' : 'approved',
        verified: rng.bool(0.82),
        helpful: rng.int(0, 96),
      })
    }
  }

  return reviews.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

export function buildDatabase() {
  const users = makeUsers()
  const orders = makeOrders(users)
  const reviews = makeReviews(users)
  return { users, orders, reviews, coupons: COUPONS, products, categories }
}

export type Database = ReturnType<typeof buildDatabase>
