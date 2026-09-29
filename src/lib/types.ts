export type Role = 'customer' | 'admin'

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  tagline: string
}

export interface ProductSpec {
  label: string
  value: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  categoryId: string
  price: number
  compareAtPrice: number | null
  cost: number
  sku: string
  stock: number
  rating: number
  reviewCount: number
  sold: number
  status: ProductStatus
  tagline: string
  description: string
  highlights: string[]
  specs: ProductSpec[]
  tags: string[]
  colors: string[]
  createdAt: string
  featured: boolean
}

export interface Address {
  id: string
  label: string
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  isDefault: boolean
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  phone: string
  createdAt: string
  status: 'active' | 'suspended'
  addresses: Address[]
  avatarColor: string
}

export interface CartLine {
  productId: string
  color: string
  qty: number
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'

export type PaymentMethod = 'card' | 'paypal' | 'cod' | 'bank'

export interface OrderItem {
  productId: string
  name: string
  brand: string
  color: string
  price: number
  qty: number
}

export interface OrderEvent {
  label: string
  at: string
  note?: string
}

export interface Order {
  id: string
  number: string
  userId: string | null
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  couponCode: string | null
  address: Omit<Address, 'id' | 'label' | 'isDefault'>
  placedAt: string
  timeline: OrderEvent[]
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  body: string
  createdAt: string
  status: ReviewStatus
  verified: boolean
  helpful: number
}

export type CouponType = 'percent' | 'fixed' | 'shipping'

export interface Coupon {
  code: string
  type: CouponType
  value: number
  minSubtotal: number
  active: boolean
  expiresAt: string
  usageLimit: number
  usedCount: number
  description: string
}

export interface Toast {
  id: string
  title: string
  description?: string
  tone: 'success' | 'error' | 'info'
}
