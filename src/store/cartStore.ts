import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine, Coupon } from '@/lib/types'
import { getDb } from '@/api/db'
import { quote, validateCoupon } from '@/api/orders'

export type ShippingMethod = 'standard' | 'express'

const EXPRESS_SURCHARGE = 14.5

interface CartState {
  lines: CartLine[]
  coupon: Coupon | null
  shippingMethod: ShippingMethod
  lastAdded: string | null
  add: (productId: string, color: string, qty?: number) => void
  setQty: (productId: string, color: string, qty: number) => void
  remove: (productId: string, color: string) => void
  clear: () => void
  applyCoupon: (code: string) => { ok: boolean; message: string }
  removeCoupon: () => void
  setShippingMethod: (m: ShippingMethod) => void
  has: (productId: string) => boolean
  count: () => number
  totals: () => ReturnType<typeof quote>
}

function productById(id: string) {
  return getDb().products.find((p) => p.id === id)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      coupon: null,
      shippingMethod: 'standard',
      lastAdded: null,

      add(productId, color, qty = 1) {
        const lines = [...get().lines]
        const i = lines.findIndex((l) => l.productId === productId && l.color === color)
        if (i >= 0) lines[i] = { ...lines[i], qty: Math.min(10, lines[i].qty + qty) }
        else lines.push({ productId, color, qty: Math.min(10, qty) })
        set({ lines, lastAdded: `${productId}:${color}` })
      },

      setQty(productId, color, qty) {
        const lines =
          qty <= 0
            ? get().lines.filter((l) => !(l.productId === productId && l.color === color))
            : get().lines.map((l) =>
                l.productId === productId && l.color === color ? { ...l, qty: Math.min(10, qty) } : l,
              )
        set({ lines })
      },

      remove(productId, color) {
        set({ lines: get().lines.filter((l) => !(l.productId === productId && l.color === color)) })
      },

      clear() {
        set({ lines: [], coupon: null, shippingMethod: 'standard', lastAdded: null })
      },

      applyCoupon(code) {
        const { lines } = get()
        const subtotal = lines.reduce((sum, l) => {
          const p = productById(l.productId)
          return sum + (p ? p.price * l.qty : 0)
        }, 0)
        const result = validateCoupon(code, subtotal)
        if (result.error || !result.coupon) {
          return { ok: false, message: result.error ?? 'That code cannot be applied.' }
        }
        set({ coupon: result.coupon })
        return { ok: true, message: `${result.coupon.code} applied — ${result.coupon.description}` }
      },

      removeCoupon() {
        set({ coupon: null })
      },

      setShippingMethod(shippingMethod) {
        set({ shippingMethod })
      },

      has: (productId) => get().lines.some((l) => l.productId === productId),
      count: () => get().lines.reduce((sum, l) => sum + l.qty, 0),

      totals() {
        const { lines, coupon, shippingMethod } = get()
        const base = quote(lines, coupon)
        const surcharge = shippingMethod === 'express' ? EXPRESS_SURCHARGE : 0
        return surcharge
          ? { ...base, shipping: Math.round((base.shipping + surcharge) * 100) / 100, total: Math.round((base.total + surcharge) * 100) / 100 }
          : base
      },
    }),
    { name: 'cart', partialize: (s) => ({ lines: s.lines, coupon: s.coupon, shippingMethod: s.shippingMethod }) },
  ),
)
