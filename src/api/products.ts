import { getDb, mutate } from './db'
import { request, ApiError } from './client'
import type { Product } from '@/lib/types'

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'bestselling' | 'name'

export interface ProductQuery {
  q?: string
  category?: string
  brands?: string[]
  tags?: string[]
  min?: number
  max?: number
  rating?: number
  sale?: boolean
  inStock?: boolean
  sort?: SortKey
  page?: number
  perPage?: number
}

export interface ProductFacets {
  brands: { name: string; count: number }[]
  tags: { name: string; count: number }[]
  priceMin: number
  priceMax: number
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  pages: number
  facets: ProductFacets
}

export function getCategories() {
  return getDb().categories
}

export function getProductBySlug(slug: string) {
  return request(() => getDb().products.find((p) => p.slug === slug) ?? null, { min: 140, max: 320 })
}

export function getProductById(id: string) {
  return request(() => getDb().products.find((p) => p.id === id) ?? null, { min: 40, max: 120 })
}

export function getProductMap(): Record<string, Product> {
  return Object.fromEntries(getDb().products.map((p) => [p.id, p]))
}

export function listProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const {
    q = '',
    category = '',
    brands = [],
    tags = [],
    min,
    max,
    rating = 0,
    sale = false,
    inStock = false,
    sort = 'featured',
    page = 1,
    perPage = 12,
  } = query

  return request(
    () => {
      const { products, categories } = getDb()
      const catId = categories.find((c) => c.slug === category)?.id
      const term = q.trim().toLowerCase()

      const all = products.filter((p) => p.status === 'active')

      const facets: ProductFacets = {
        brands: countBy(all.map((p) => p.brand)),
        tags: countBy(all.flatMap((p) => p.tags)),
        priceMin: Math.floor(Math.min(...all.map((p) => p.price))),
        priceMax: Math.ceil(Math.max(...all.map((p) => p.price))),
      }

      const filtered = all.filter((p) => {
        if (catId && p.categoryId !== catId) return false
        if (brands.length && !brands.includes(p.brand)) return false
        if (tags.length && !tags.some((t) => p.tags.includes(t))) return false
        if (min != null && p.price < min) return false
        if (max != null && p.price > max) return false
        if (rating && p.rating < rating) return false
        if (sale && !p.compareAtPrice) return false
        if (inStock && p.stock === 0) return false
        if (term) {
          const haystack = `${p.name} ${p.brand} ${p.tagline} ${p.tags.join(' ')} ${p.description}`.toLowerCase()
          if (!term.split(/\s+/).every((word) => haystack.includes(word))) return false
        }
        return true
      })

      const sorted = [...filtered].sort((a, b) => {
        switch (sort) {
          case 'price-asc':
            return a.price - b.price
          case 'price-desc':
            return b.price - a.price
          case 'rating':
            return b.rating - a.rating || b.reviewCount - a.reviewCount
          case 'newest':
            return +new Date(b.createdAt) - +new Date(a.createdAt)
          case 'bestselling':
            return b.sold - a.sold
          case 'name':
            return a.name.localeCompare(b.name)
          default:
            return Number(b.featured) - Number(a.featured) || b.sold - a.sold
        }
      })

      const total = sorted.length
      const pages = Math.max(1, Math.ceil(total / perPage))
      const safePage = Math.min(Math.max(1, page), pages)

      return {
        items: sorted.slice((safePage - 1) * perPage, safePage * perPage),
        total,
        page: safePage,
        pages,
        facets,
      }
    },
    { min: 220, max: 620 },
  )
}

export function getFeatured(limit = 8) {
  return request(
    () => {
      const { products, categories } = getDb()
      return categories.flatMap((c) =>
        products.filter((p) => p.categoryId === c.id && p.status === 'active' && p.featured),
      )
        .sort((a, b) => b.sold - a.sold)
        .slice(0, limit)
    },
    { min: 200, max: 500 },
  )
}

export function getDeals(limit = 8) {
  return request(
    () =>
      getDb()
        .products.filter((p) => p.status === 'active' && p.compareAtPrice)
        .sort((a, b) => b.compareAtPrice! - b.price - (a.compareAtPrice! - a.price))
        .slice(0, limit),
    { min: 200, max: 500 },
  )
}

export function getNewArrivals(limit = 8) {
  return request(
    () =>
      getDb()
        .products.filter((p) => p.status === 'active')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit),
    { min: 200, max: 500 },
  )
}

export function getRelated(productId: string, limit = 4) {
  return request(
    () => {
      const { products } = getDb()
      const source = products.find((p) => p.id === productId)
      if (!source) return []
      return products
        .filter(
          (p) =>
            p.id !== productId &&
            p.status === 'active' &&
            (p.categoryId === source.categoryId || p.brand === source.brand || p.tags.some((t) => source.tags.includes(t))),
        )
        .sort((a, b) => b.rating * Math.log(b.reviewCount) - a.rating * Math.log(a.reviewCount))
        .slice(0, limit)
    },
    { min: 200, max: 450 },
  )
}

export function getReviewsFor(productId: string) {
  return request(
    () => getDb().reviews.filter((r) => r.productId === productId && r.status === 'approved'),
    { min: 160, max: 400 },
  )
}

export function listReviewsForUser(userId: string) {
  return request(() => {
    const db = getDb()
    return db.reviews
      .filter((r) => r.userId === userId)
      .map((r) => ({ review: r, product: db.products.find((p) => p.id === r.productId) }))
      .filter((row): row is { review: (typeof db.reviews)[number]; product: Product } => Boolean(row.product))
  })
}

export function submitReview(input: { productId: string; userId: string; userName: string; rating: number; title: string; body: string }) {
  return request(
    () =>
      mutate((db) => {
        const review = {
          id: `r-user-${Date.now()}`,
          productId: input.productId,
          userId: input.userId,
          userName: input.userName,
          rating: input.rating,
          title: input.title,
          body: input.body,
          createdAt: new Date().toISOString(),
          status: 'pending' as const,
          verified: true,
          helpful: 0,
        }
        db.reviews.unshift(review)
        return review
      }),
    { min: 400, max: 800 },
  )
}

export function deleteReview(reviewId: string) {
  return request(
    () =>
      mutate((db) => {
        db.reviews = db.reviews.filter((r) => r.id !== reviewId)
      }),
    { min: 200, max: 400 },
  )
}

/* ------------------------------ admin writes ----------------------------- */

export function createProduct(input: Omit<Product, 'id' | 'slug' | 'reviewCount' | 'rating' | 'sold' | 'createdAt'>) {
  return request(
    () =>
      mutate((db) => {
        const slug = `${input.brand}-${input.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        const product: Product = {
          ...input,
          id: `p-new-${Date.now()}`,
          slug,
          rating: 0,
          reviewCount: 0,
          sold: 0,
          createdAt: new Date().toISOString(),
        }
        db.products.unshift(product)
        return product
      }),
    { min: 400, max: 800 },
  )
}

export function updateProduct(id: string, patch: Partial<Product>) {
  return request(
    () =>
      mutate((db) => {
        const i = db.products.findIndex((p) => p.id === id)
        if (i < 0) throw new ApiError('Product not found', 404)
        db.products[i] = { ...db.products[i], ...patch }
        return db.products[i]
      }),
    { min: 350, max: 700 },
  )
}

export function deleteProduct(id: string) {
  return request(
    () =>
      mutate((db) => {
        db.products = db.products.filter((p) => p.id !== id)
      }),
    { min: 350, max: 700 },
  )
}

function countBy(values: string[]) {
  const map = new Map<string, number>()
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1)
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
