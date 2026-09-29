import { getDb, mutate } from './db'
import { request } from './client'
import type { Coupon, Order, Product, ReviewStatus, User } from '@/lib/types'

const DAY = 86400000

export interface AdminStats {
  revenue30: number
  revenue30Prev: number
  orders30: number
  orders30Prev: number
  customers: number
  newCustomers30: number
  aov: number
  refundRate: number
  revenueSeries: { month: string; revenue: number; prev: number }[]
  dailySeries: { date: string; orders: number; revenue: number }[]
  categorySplit: { name: string; value: number; revenue: number }[]
  statusSplit: { name: string; value: number }[]
  channelSplit: { name: string; value: number }[]
  topProducts: { product: Product; units: number; revenue: number }[]
  lowStock: Product[]
  recentOrders: Order[]
  pendingReviews: number
  funnel: { stage: string; value: number }[]
}

const CHANNELS = ['Organic search', 'Direct', 'Email', 'Paid social', 'Referral', 'Marketplace']

export function getAdminStats(): Promise<AdminStats> {
  return request(
    () => {
      const db = getDb()
      const { orders, products, users, categories, reviews } = db
      const paid = orders.filter((o) => o.paymentStatus === 'paid' && o.status !== 'refunded')
      const now = Date.now()
      const inWindow = (o: Order, days: number) => now - +new Date(o.placedAt) <= days * DAY

      const revenue30 = paid.filter((o) => inWindow(o, 30)).reduce((s, o) => s + o.total, 0)
      const revenue30Prev = paid
        .filter((o) => now - +new Date(o.placedAt) > 30 * DAY && now - +new Date(o.placedAt) <= 60 * DAY)
        .reduce((s, o) => s + o.total, 0)
      const orders30 = orders.filter((o) => inWindow(o, 30)).length
      const orders30Prev = orders.filter((o) => now - +new Date(o.placedAt) > 30 * DAY && now - +new Date(o.placedAt) <= 60 * DAY).length

      const revenueSeries: AdminStats['revenueSeries'] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const label = d.toLocaleString('en-US', { month: 'short' })
        const current = paid
          .filter((o) => {
            const od = new Date(o.placedAt)
            return `${od.getFullYear()}-${od.getMonth()}` === key
          })
          .reduce((s, o) => s + o.total, 0)
        const prev = paid
          .filter((o) => {
            const od = new Date(o.placedAt)
            od.setMonth(od.getMonth() + 12)
            return `${od.getFullYear()}-${od.getMonth()}` === key
          })
          .reduce((s, o) => s + o.total, 0)
        revenueSeries.push({ month: label, revenue: Math.round(current), prev: Math.round(prev) })
      }

      const dailySeries: AdminStats['dailySeries'] = []
      for (let i = 13; i >= 0; i--) {
        const dayStart = new Date(now - i * DAY)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = dayStart.getTime() + DAY
        const slice = orders.filter((o) => {
          const t = +new Date(o.placedAt)
          return t >= dayStart.getTime() && t < dayEnd
        })
        dailySeries.push({
          date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          orders: slice.length,
          revenue: Math.round(slice.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)),
        })
      }

      const productRevenue = new Map<string, { units: number; revenue: number }>()
      for (const o of paid) {
        for (const item of o.items) {
          const entry = productRevenue.get(item.productId) ?? { units: 0, revenue: 0 }
          entry.units += item.qty
          entry.revenue += item.qty * item.price
          productRevenue.set(item.productId, entry)
        }
      }

      const categorySplit = categories
        .map((c) => {
          const ids = new Set(products.filter((p) => p.categoryId === c.id).map((p) => p.id))
          let revenue = 0
          for (const [pid, v] of productRevenue) if (ids.has(pid)) revenue += v.revenue
          return { name: c.name, value: products.filter((p) => p.categoryId === c.id).length, revenue: Math.round(revenue) }
        })
        .sort((a, b) => b.revenue - a.revenue)

      const statusCounts: Record<string, number> = {}
      for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
      const statusSplit = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

      const channelSplit = CHANNELS.map((name, i) => ({ name, value: [38, 24, 14, 12, 8, 4][i] }))

      const topProducts = [...productRevenue.entries()]
        .map(([pid, v]) => ({ product: products.find((p) => p.id === pid)!, units: v.units, revenue: Math.round(v.revenue) }))
        .filter((r) => r.product)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6)

      const lowStock = products
        .filter((p) => p.status === 'active' && p.stock <= 25)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6)

      const refunded = orders.filter((o) => o.status === 'refunded').length

      return {
        revenue30: Math.round(revenue30),
        revenue30Prev: Math.round(revenue30Prev),
        orders30,
        orders30Prev,
        customers: users.filter((u) => u.role === 'customer').length,
        newCustomers30: users.filter((u) => now - +new Date(u.createdAt) <= 30 * DAY).length,
        aov: orders30 ? Math.round(revenue30 / orders30) : 0,
        refundRate: orders.length ? Math.round((refunded / orders.length) * 1000) / 10 : 0,
        revenueSeries,
        dailySeries,
        categorySplit,
        statusSplit,
        channelSplit,
        topProducts,
        lowStock,
        recentOrders: orders.slice(0, 8),
        pendingReviews: reviews.filter((r) => r.status === 'pending').length,
        funnel: [
          { stage: 'Sessions', value: 84210 },
          { stage: 'Product views', value: 31840 },
          { stage: 'Add to cart', value: 9260 },
          { stage: 'Checkout', value: 4180 },
          { stage: 'Purchased', value: orders30 },
        ],
      }
    },
    { min: 500, max: 900 },
  )
}

export function listCustomers() {
  return request(
    () => {
      const { users, orders } = getDb()
      return users
        .filter((u) => u.role === 'customer')
        .map((u) => {
          const own = orders.filter((o) => o.userId === u.id)
          return {
            user: u,
            orders: own.length,
            spend: Math.round(own.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)),
            lastOrder: own[0]?.placedAt ?? null,
          }
        })
        .sort((a, b) => b.spend - a.spend)
    },
    { min: 350, max: 650 },
  )
}

export function setCustomerStatus(userId: string, status: User['status']) {
  return request(
    () =>
      mutate((db) => {
        const user = db.users.find((u) => u.id === userId)
        if (user) user.status = status
      }),
    { min: 300, max: 600 },
  )
}

export function listAllOrders() {
  return request(() => getDb().orders, { min: 350, max: 650 })
}

export function listAllReviews() {
  return request(() => getDb().reviews, { min: 300, max: 600 })
}

export function moderateReview(reviewId: string, status: ReviewStatus) {
  return request(
    () =>
      mutate((db) => {
        const review = db.reviews.find((r) => r.id === reviewId)
        if (!review) return
        review.status = status
        const product = db.products.find((p) => p.id === review.productId)
        if (product && status === 'approved') {
          const approved = db.reviews.filter((r) => r.productId === product.id && r.status === 'approved')
          product.reviewCount = approved.length
          product.rating = Math.round((approved.reduce((s, r) => s + r.rating, 0) / approved.length) * 10) / 10
        }
      }),
    { min: 300, max: 600 },
  )
}

export function saveCoupon(coupon: Coupon) {
  return request(
    () =>
      mutate((db) => {
        const i = db.coupons.findIndex((c) => c.code === coupon.code)
        if (i >= 0) db.coupons[i] = coupon
        else db.coupons.push(coupon)
      }),
    { min: 350, max: 650 },
  )
}

export function deleteCoupon(code: string) {
  return request(
    () =>
      mutate((db) => {
        db.coupons = db.coupons.filter((c) => c.code !== code)
      }),
    { min: 350, max: 650 },
  )
}

export function getCoupons() {
  return request(() => getDb().coupons, { min: 250, max: 500 })
}
