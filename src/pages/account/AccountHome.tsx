import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart, MapPin, Star, ArrowRight, Package, Clock, Truck, CreditCard } from 'lucide-react'
import { listOrdersForUser } from '@/api/orders'
import { getProductMap, listProducts } from '@/api/products'
import type { Order, Product } from '@/lib/types'
import { money, timeAgo, shortDate } from '@/lib/format'
import { Avatar, Button, Card, OrderStatusBadge, Skeleton, EmptyState } from '@/components/ui'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductImage } from '@/components/product/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'

export default function AccountHome() {
  const user = useAuthStore((s) => s.user)
  const wishIds = useWishlistStore((s) => s.ids)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [recommended, setRecommended] = useState<Product[] | null>(null)

  useEffect(() => {
    if (!user) return
    listOrdersForUser(user.id).then(setOrders)
    listProducts({ sort: 'bestselling', perPage: 4 }).then((r) => setRecommended(r.items))
  }, [user])

  if (!user) return null

  const spend = (orders ?? []).filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)
  const active = (orders ?? []).filter((o) => ['pending', 'processing', 'shipped'].includes(o.status))
  const productMap = getProductMap()

  const stats = [
    { label: 'Orders placed', value: String(orders?.length ?? 0), icon: ShoppingBag, to: '/account/orders', tone: 'brand' },
    { label: 'Lifetime spend', value: money(spend), icon: CreditCard, to: '/account/orders', tone: 'green' },
    { label: 'In transit', value: String(active.length), icon: Truck, to: '/account/orders', tone: 'amber' },
    { label: 'Saved items', value: String(wishIds.length), icon: Heart, to: '/account/wishlist', tone: 'red' },
  ]

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 bg-gradient-to-br from-ink-950 to-ink-800 p-6 text-white">
          <Avatar name={user.name} color={user.avatarColor} size={64} className="ring-4 ring-white/10" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Member since</p>
            <p className="text-lg font-bold">{shortDate(user.createdAt)}</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              to="/account/profile"
              className="inline-flex h-10 items-center rounded-xl bg-white/15 px-4 text-[13px] font-semibold transition hover:bg-white/25"
            >
              Edit profile
            </Link>
            <Link
              to="/shop"
              className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-[13px] font-semibold text-ink-900 transition hover:bg-ink-100"
            >
              Shop now
            </Link>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-bold text-ink-900">Hello, {user.name.split(' ')[0]}</h2>
          <p className="mt-1 text-sm text-ink-500">
            {active.length > 0
              ? `You have ${active.length} order${active.length === 1 ? '' : 's'} on the way.`
              : 'Nothing in transit right now. The deals tab is a good place to look.'}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <span
                className={`mb-3 flex size-10 items-center justify-center rounded-xl ${
                  { brand: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600' }[s.tone]
                }`}
              >
                <s.icon className="size-4.5" />
              </span>
              <p className="text-2xl font-extrabold text-ink-900">{s.value}</p>
              <p className="mt-0.5 text-[13px] text-ink-500">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">Recent orders</h2>
          <Link to="/account/orders" className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {orders === null ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="size-6" />}
            title="No orders yet"
            description="When you place an order it will show up here with live tracking."
            action={<Button onClick={() => (window.location.href = '/shop')}>Start shopping</Button>}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {orders.slice(0, 4).map((order) => (
              <li key={order.id}>
                <Link to={`/account/orders/${order.number}`} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-ink-50">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 3).map((item) => {
                      const p = productMap[item.productId]
                      return p ? (
                        <ProductImage key={`${item.productId}-${item.color}`} product={p} selectedColor={item.color} className="size-12 rounded-lg ring-2 ring-white" iconSize="sm" />
                      ) : null
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-ink-900">{order.number}</p>
                    <p className="text-[13px] text-ink-500">
                      {timeAgo(order.placedAt)} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                  <span className="w-24 text-right text-sm font-bold text-ink-900">{money(order.total)}</span>
                  <ArrowRight className="size-4 text-ink-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { to: '/account/orders', icon: Clock, title: 'Track an order', sub: 'Live status on everything you have bought' },
          { to: '/account/addresses', icon: MapPin, title: 'Manage addresses', sub: `${user.addresses.length} saved on your account` },
          { to: '/account/reviews', icon: Star, title: 'Write a review', sub: 'Earn credit and help other buyers' },
        ].map((q) => (
          <Link key={q.to} to={q.to}>
            <Card className="flex h-full items-start gap-3 p-5 transition hover:border-ink-300 hover:shadow-md">
              <q.icon className="size-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink-900">{q.title}</p>
                <p className="mt-0.5 text-[13px] text-ink-500">{q.sub}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-bold text-ink-900">You might also like</h2>
          <Link to="/shop" className="text-[13px] font-semibold text-brand-700 hover:underline">
            Browse all
          </Link>
        </div>
        {recommended === null ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

