import { useMemo } from 'react'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { getProductMap } from '@/api/products'
import type { Product } from '@/lib/types'
import { money } from '@/lib/format'
import { Button, Card, EmptyState, ProductCardSkeleton } from '@/components/ui'
import { ProductCard } from '@/components/product/ProductCard'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { toast } from '@/store/toastStore'

export default function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids)
  const remove = useWishlistStore((s) => s.remove)
  const clearViewed = useWishlistStore((s) => s.clearViewed)
  const recentlyViewed = useWishlistStore((s) => s.recentlyViewed)
  const add = useCartStore((s) => s.add)

  const productMap = getProductMap()
  const items = useMemo(
    () => ids.map((id) => productMap[id]).filter((p): p is Product => Boolean(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(',')],
  )
  const viewed = recentlyViewed.map((id) => productMap[id]).filter((p): p is Product => Boolean(p))
  const total = items.reduce((s, p) => s + p.price, 0)
  const inStock = items.filter((p) => p.stock > 0).length

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Heart className="size-5 fill-current" />
          </span>
          <div>
            <p className="text-lg font-bold text-ink-900">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
            <p className="text-[13px] text-ink-500">
              {inStock} in stock · {money(total)} total
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!inStock}
            onClick={() => {
              items.filter((p) => p.stock > 0).forEach((p) => add(p.id, p.colors[0] ?? '#111827'))
              toast.success('Added to bag', `${inStock} items`)
            }}
          >
            Add all in stock
          </Button>
          {items.length > 0 && (
            <Button
              variant="ghost"
              icon={<Trash2 className="size-4" />}
              onClick={() => {
                items.forEach((p) => remove(p.id))
                toast.info('Wishlist cleared')
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-6" />}
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here. We will warn you if it drops in price."
          action={<Button onClick={() => (window.location.href = '/shop')}>Browse products</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {viewed.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">Recently viewed</h2>
            <button onClick={clearViewed} className="text-[13px] font-semibold text-ink-500 hover:text-ink-800">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {viewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      <Card className="flex items-center gap-4 p-5">
        <ShoppingBag className="size-5 text-ink-400" />
        <p className="flex-1 text-[13px] text-ink-600">
          Wishlist items are stored in your browser for this demo. Signing in on another device will not sync them.
        </p>
      </Card>
    </div>
  )
}
