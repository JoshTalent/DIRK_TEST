import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
import type { Product } from '@/lib/types'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { toast } from '@/store/toastStore'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { ProductImage } from './ProductImage'

function discountPct(p: Product) {
  if (!p.compareAtPrice) return 0
  return Math.round((1 - p.price / p.compareAtPrice) * 100)
}

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const add = useCartStore((s) => s.add)
  const toggleWish = useWishlistStore((s) => s.toggle)
  const wishIds = useWishlistStore((s) => s.ids)
  const wished = wishIds.includes(product.id)
  const pct = discountPct(product)
  const soldOut = product.stock === 0
  const lowStock = product.stock > 0 && product.stock <= 8

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lg hover:shadow-ink-200/60',
        className,
      )}
    >
      <Link to={`/product/${product.slug}`} className="relative block">
        <ProductImage product={product} className="aspect-4/3 w-full" />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {pct > 0 && <Badge tone="red">-{pct}%</Badge>}
          {product.featured && pct === 0 && <Badge tone="brand">Featured</Badge>}
          {lowStock && <Badge tone="amber">Only {product.stock} left</Badge>}
        </div>
        <span className="absolute right-3 bottom-3 flex size-8 translate-y-2 items-center justify-center rounded-full bg-white/90 text-ink-600 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <Eye className="size-4" />
        </span>
      </Link>

      <button
        onClick={() => {
          const added = toggleWish(product.id)
          toast.info(added ? 'Saved to wishlist' : 'Removed from wishlist', product.name)
        }}
        aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
        className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/85 text-ink-500 backdrop-blur transition hover:bg-white hover:text-red-500"
      >
        <Heart className={cn('size-4 transition', wished && 'fill-red-500 text-red-500')} />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-semibold text-ink-900">
          <Link to={`/product/${product.slug}`} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-center gap-1.5">
          <Rating value={product.rating} showValue={false} />
          <span className="text-[11px] text-ink-400">
            {product.rating.toFixed(1)} · {product.reviewCount} reviews
          </span>
        </div>

        <div className="mt-3 flex flex-1 items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-ink-900">{money(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-ink-400 line-through">{money(product.compareAtPrice)}</span>
              )}
            </div>
            {product.colors.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1">
                {product.colors.slice(0, 4).map((c) => (
                  <span
                    key={c}
                    className="size-2.5 rounded-full ring-1 ring-ink-900/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-[10px] text-ink-400">+{product.colors.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          disabled={soldOut}
          onClick={() => {
            add(product.id, product.colors[0] ?? '#111827')
            toast.success('Added to bag', product.name)
          }}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-[13px] font-semibold text-white transition hover:bg-ink-800 disabled:bg-ink-200 disabled:text-ink-400"
        >
          <ShoppingBag className="size-4" />
          {soldOut ? 'Out of stock' : 'Add to bag'}
        </button>
      </div>
    </article>
  )
}

export function ProductCardCompact({ product }: { product: Product }) {
  return (
    <Link
      to={`/product/${product.slug}`}
      className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-ink-50"
    >
      <ProductImage product={product} className="size-14 shrink-0 rounded-lg" iconSize="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink-800">{product.name}</p>
        <p className="text-xs text-ink-500">{money(product.price)}</p>
      </div>
    </Link>
  )
}

export { discountPct }
