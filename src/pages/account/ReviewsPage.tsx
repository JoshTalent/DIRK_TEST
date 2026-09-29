import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Trash2, MessageSquare, Plus } from 'lucide-react'
import { listReviewsForUser, deleteReview, submitReview, getProductMap } from '@/api/products'
import type { Product, Review } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Rating, ReviewStatusBadge, Select, Skeleton, Textarea } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { listOrdersForUser } from '@/api/orders'

type Row = { review: Review; product: Product }

export default function ReviewsPage() {
  const user = useAuthStore((s) => s.user)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [writeOpen, setWriteOpen] = useState(false)

  const load = () => {
    if (!user) return
    listReviewsForUser(user.id).then(setRows)
  }

  useEffect(load, [user])

  const pending = rows?.filter((r) => r.review.status === 'pending').length ?? 0

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-lg font-bold text-ink-900">Your reviews</p>
          <p className="text-[13px] text-ink-500">
            {rows?.length ?? 0} written
            {pending > 0 && ` · ${pending} awaiting moderation`}
          </p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => setWriteOpen(true)}>
          Write a review
        </Button>
      </Card>

      {pending > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 ring-inset">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-[13px] text-amber-900">
            {pending} of your reviews {pending === 1 ? 'is' : 'are'} waiting for a moderator. Most are published within a
            few hours. Open the <Link to="/admin/reviews" className="font-semibold underline">admin review queue</Link> to
            see the workflow.
          </p>
        </div>
      )}

      {rows === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Star className="size-6" />}
          title="You have not written a review yet"
          description="Reviews earn you store credit and are the single biggest driver of other people's decisions."
          action={<Button onClick={() => setWriteOpen(true)}>Write your first review</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ review, product }) => (
            <li key={review.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <Link to={`/product/${product.slug}`} className="shrink-0">
                    <ProductImage product={product} className="size-16 rounded-xl" iconSize="sm" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/product/${product.slug}`} className="text-sm font-semibold text-ink-900 hover:text-brand-700">
                        {product.name}
                      </Link>
                      <ReviewStatusBadge status={review.status} />
                      {review.verified && <Badge tone="green">Verified</Badge>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Rating value={review.rating} showValue={false} />
                      <span className="text-[13px] text-ink-500">{timeAgo(review.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-ink-800">{review.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{review.body}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await deleteReview(review.id)
                      setRows((r) => r?.filter((x) => x.review.id !== review.id) ?? null)
                      toast.info('Review deleted')
                    }}
                    className="shrink-0 text-ink-400 transition hover:text-red-600"
                    aria-label="Delete review"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        title="Write a review"
        description="Pick one of your delivered orders."
        size="lg"
      >
        <ReviewComposer
          onDone={() => {
            setWriteOpen(false)
            load()
          }}
        />
      </Modal>
    </div>
  )
}

function ReviewComposer({ onDone }: { onDone: () => void }) {
  const user = useAuthStore((s) => s.user)
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    listOrdersForUser(user.id).then((orders) => {
      const ids = new Set<string>()
      orders.filter((o) => o.status === 'delivered').forEach((o) => o.items.forEach((i) => ids.add(i.productId)))
      const map = getProductMap()
      setProducts([...ids].map((id) => map[id]).filter((p): p is Product => Boolean(p)))
    })
  }, [user])

  const submit = async () => {
    if (!user || !productId || !body.trim()) return
    setSaving(true)
    await submitReview({
      productId,
      userId: user.id,
      userName: user.name,
      rating,
      title: title || 'My experience',
      body,
    })
    setSaving(false)
    toast.success('Review submitted', 'It will appear once a moderator approves it.')
    onDone()
  }

  return (
    <div className="space-y-4">
      <Field label="Product" required>
        <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Choose a delivered product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>

      {products.length === 0 && (
        <p className="rounded-xl bg-ink-50 p-3 text-[13px] text-ink-600">
          You have no delivered orders yet, so there is nothing to review. Place an order first.
        </p>
      )}

      <Field label="Rating" required>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={cn(
                'size-11 rounded-xl border text-sm font-semibold transition',
                rating >= n ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-ink-200 text-ink-400 hover:border-ink-300',
              )}
            >
              {n}★
            </button>
          ))}
        </div>
      </Field>

      <Field label="Headline">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your experience" />
      </Field>

      <Field label="Your review" required>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="How did you use it? How has it held up?" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button loading={saving} disabled={!productId || !body.trim()} onClick={submit}>
          Submit review
        </Button>
      </div>
    </div>
  )
}

