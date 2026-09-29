import { getDb, mutate } from './db'
import { request, ApiError } from './client'
import type { Address, CartLine, Coupon, Order, OrderEvent, OrderStatus, PaymentMethod } from '@/lib/types'
import { money } from '@/lib/format'

export const FREE_SHIPPING_THRESHOLD = 99
export const TAX_RATE = 0.0825
export const FLAT_SHIPPING = 12.95

export function priceOf(line: CartLine) {
  const p = getDb().products.find((x) => x.id === line.productId)
  return p ? p.price * line.qty : 0
}

export function validateCoupon(code: string, subtotal: number): { coupon: Coupon; error?: never } | { coupon?: never; error: string } {
  const db = getDb()
  const coupon = db.coupons.find((c) => c.code === code.trim().toUpperCase())
  if (!coupon) return { error: 'That code is not recognised.' }
  if (!coupon.active) return { error: 'That code is no longer active.' }
  if (new Date(coupon.expiresAt) < new Date()) return { error: 'That code has expired.' }
  if (subtotal < coupon.minSubtotal) return { error: `Requires a subtotal of at least ${money(coupon.minSubtotal)}.` }
  return { coupon }
}

export function quote(lines: CartLine[], coupon: Coupon | null) {
  const db = getDb()
  const subtotal = lines.reduce((sum, line) => {
    const p = db.products.find((x) => x.id === line.productId)
    return sum + (p ? p.price * line.qty : 0)
  }, 0)

  let discount = 0
  if (coupon?.active) {
    if (coupon.type === 'percent') discount = subtotal * (coupon.value / 100)
    else if (coupon.type === 'fixed') discount = Math.min(coupon.value, subtotal)
  }

  const shipping =
    coupon?.type === 'shipping' || subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING
  const tax = Math.max(0, subtotal - discount) * TAX_RATE
  const total = Math.max(0, subtotal - discount + shipping + tax)

  return {
    subtotal: round(subtotal),
    discount: round(discount),
    shipping: round(shipping),
    tax: round(tax),
    total: round(total),
  }
}

const round = (n: number) => Math.round(n * 100) / 100

export function listOrdersForUser(userId: string) {
  return request(() => getDb().orders.filter((o) => o.userId === userId), { min: 260, max: 560 })
}

export function getOrderByNumber(number: string, userId?: string) {
  return request(() => {
    const order = getDb().orders.find((o) => o.number.toLowerCase() === number.trim().toLowerCase())
    if (!order) return null
    if (userId && order.userId && order.userId !== userId) return null
    return order
  })
}

export interface PlaceOrderInput {
  userId: string | null
  email: string
  lines: CartLine[]
  couponCode: string | null
  address: Omit<Address, 'id' | 'isDefault'>
  shippingMethod: 'standard' | 'express'
  paymentMethod: PaymentMethod
  card: { number: string; name: string; expiry: string; cvc: string }
}

export function placeOrder(input: PlaceOrderInput) {
  return request(
    () =>
      mutate((db) => {
        if (!input.lines.length) throw new ApiError('Your cart is empty.', 400)

        for (const line of input.lines) {
          const product = db.products.find((p) => p.id === line.productId)
          if (!product) throw new ApiError('An item in your cart no longer exists.', 409)
          if (product.stock < line.qty) {
            throw new ApiError(`Only ${product.stock} unit${product.stock === 1 ? '' : 's'} of ${product.name} left in stock.`, 409)
          }
        }

        if (input.paymentMethod === 'card') {
          const digits = input.card.number.replace(/\D/g, '')
          if (digits.length < 15) throw new ApiError('Enter a valid card number.', 402)
          if (digits.endsWith('0002')) throw new ApiError('Your card was declined by the issuer.', 402)
        }

        const coupon = input.couponCode ? db.coupons.find((c) => c.code === input.couponCode) ?? null : null
        const base = quote(input.lines, coupon)
        const expressSurcharge = input.shippingMethod === 'express' ? 14.5 : 0
        const totals = {
          ...base,
          shipping: base.shipping + expressSurcharge,
          total: round(base.total + expressSurcharge),
        }

        const seq = db.orders.length + 10000
        const now = new Date()
        const timeline: OrderEvent[] = [{ label: 'Order placed', at: now.toISOString() }]

        const cod = input.paymentMethod === 'cod'
        const order: Order = {
          id: `o-${seq}`,
          number: `AU-${seq}`,
          userId: input.userId,
          customerName: input.address.fullName,
          customerEmail: input.email,
          items: input.lines.map((line) => {
            const product = db.products.find((p) => p.id === line.productId)!
            return {
              productId: product.id,
              name: product.name,
              brand: product.brand,
              color: line.color,
              price: product.price,
              qty: line.qty,
            }
          }),
          ...totals,
          status: 'processing',
          paymentStatus: cod ? 'unpaid' : 'paid',
          paymentMethod: input.paymentMethod,
          couponCode: input.couponCode,
          address: {
            fullName: input.address.fullName,
            line1: input.address.line1,
            line2: input.address.line2,
            city: input.address.city,
            state: input.address.state,
            zip: input.address.zip,
            country: input.address.country,
            phone: input.address.phone,
          },
          placedAt: now.toISOString(),
          timeline: cod
            ? timeline
            : [...timeline, { label: 'Payment confirmed', at: new Date(now.getTime() + 1500).toISOString() }],
        }

        // "Stock movement" happens server side.
        for (const line of input.lines) {
          const product = db.products.find((p) => p.id === line.productId)!
          product.stock = Math.max(0, product.stock - line.qty)
          product.sold += line.qty
        }
        if (coupon) coupon.usedCount += 1

        db.orders.unshift(order)
        return order
      }),
    { min: 800, max: 1400 },
  )
}

export interface UpdateOrderInput {
  status?: OrderStatus
  paymentStatus?: Order['paymentStatus']
  note?: string
}

const FLOW: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']

export function updateOrder(orderId: string, input: UpdateOrderInput) {
  return request(
    () =>
      mutate((db) => {
        const order = db.orders.find((o) => o.id === orderId)
        if (!order) throw new ApiError('Order not found', 404)
        if (input.status && input.status !== order.status) {
          order.status = input.status
          if (input.status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid'
          if (input.status === 'cancelled' || input.status === 'refunded') {
            for (const item of order.items) {
              const product = db.products.find((p) => p.id === item.productId)
              if (product) product.stock += item.qty
            }
          }
          order.timeline.push({
            label: statusLabel(input.status),
            at: new Date().toISOString(),
            note: input.note,
          })
        }
        if (input.paymentStatus) order.paymentStatus = input.paymentStatus
        return order
      }),
    { min: 350, max: 700 },
  )
}

export function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: 'Awaiting payment',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }
  return labels[status]
}

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = FLOW.indexOf(status)
  if (i < 0 || i === FLOW.length - 1) return null
  return FLOW[i + 1]
}
