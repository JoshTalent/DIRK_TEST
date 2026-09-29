import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Inbox, Filter } from 'lucide-react'
import { listAllReviews, moderateReview } from '@/api/admin'
import { getProductMap } from '@/api/products'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Product, Review, ReviewStatus } from '@/lib/types'
import { Avatar, Badge, Button, Card, EmptyState, Rating, ReviewStatusBadge, SegmentedControl, Select, Spinner } from '@/components/ui'
import { Panel } from '@/components/charts/Charts'
import { toast } from '@/store/toastStore'

type Row = { review: Review; product: Product | null }

const TABS: { value: ReviewStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Queue' },
  { value: 'approved', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

export default function AdminReviews() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [tab, setTab] = useState<ReviewStatus | 'all'>('pending')
  const [rating, setRating] = useState('all')
  const [busy, setBusy] = useState<string | null>(null)
  const productMap = getProductMap()

  useEffect(() => {
    listAllReviews().then((reviews) => {
      setRows(reviews.map((review) => ({ review, product: productMap[review.productId] ?? null })))
    })
  }, [productMap])

  const counts = useMemo(() => {
    const base = { pending: 0, approved: 0, rejected: 0, all: 0 }
    for (const r of rows ?? []) {
      base.all++
      base[r.review.status]++
    }
    return base
  }, [rows])

  const filtered = useMemo(() => {
    if (!rows) return []
    return rows
      .filter((r) => (tab === 'all' ? true : r.review.status === tab))
      .filter((r) => (rating === 'all' ? true : r.review.rating === Number(rating)))
      .sort((a, b) => +new Date(b.review.createdAt) - +new Date(a.review.createdAt))
  }, [rows, tab, rating])

  const moderate = async (review: Review, status: ReviewStatus) => {
    setBusy(review.id)
    try {
      await moderateReview(review.id, status)
      setRows((list) =>
        list?.map((r) => (r.review.id === review.id ? { ...r, review: { ...r.review, status } } : r)) ?? null,
      )
      toast.success(status === 'approved' ? 'Review published' : 'Review rejected', `${review.rating}★ from ${review.userName}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Review moderation</h1>
        <p className="text-[13px] text-ink-500">
          Approving a review recomputes the product rating and review count immediately.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TABS.slice(0, 3).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-2xl border p-5 text-left transition',
              tab === t.value ? 'border-brand-300 bg-brand-50/40' : 'border-ink-200 bg-white hover:border-ink-300',
            )}
          >
            <p className="text-[13px] font-medium text-ink-500">{t.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink-900 tabular-nums">{(counts as Record<string, number>)[t.value] ?? 0}</p>
          </button>
        ))}
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={TABS.map((t) => ({ value: t.value, label: t.label }))}
          />
          <div className="ml-auto flex items-center gap-2">
            <Filter className="size-4 text-ink-400" />
            <Select value={rating} onChange={(e) => setRating(e.target.value)} className="w-36">
              <option value="all">Any rating</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </Select>
          </div>
        </div>

        {rows === null ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="size-7 text-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-6" />}
            title={tab === 'pending' ? 'Queue is clear' : 'Nothing to show'}
            description={tab === 'pending' ? 'No reviews are waiting for moderation right now.' : 'Try another filter.'}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {filtered.map(({ review, product }) => (
              <li key={review.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar name={review.userName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-ink-900">{review.userName}</p>
                      <Rating value={review.rating} showValue={false} />
                      <ReviewStatusBadge status={review.status} />
                      {review.verified ? <Badge tone="teal">Verified buyer</Badge> : null}
                      {review.helpful > 0 ? <span className="text-xs text-ink-400">{review.helpful} found this helpful</span> : null}
                    </div>
                    {product ? (
                      <Link
                        to={`/product/${product.slug}`}
                        className="mt-1 inline-block text-[13px] font-medium text-brand-700 hover:underline"
                      >
                        {product.name}
                      </Link>
                    ) : (
                      <p className="mt-1 text-[13px] text-ink-400">Product removed from catalog</p>
                    )}
                    <p className="mt-2 text-sm font-medium text-ink-800">{review.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{review.body}</p>
                    <p className="mt-2 text-xs text-ink-400">Submitted {timeAgo(review.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {review.status !== 'approved' ? (
                      <Button
                        size="sm"
                        icon={<Check className="size-3.5" />}
                        loading={busy === review.id}
                        onClick={() => moderate(review, 'approved')}
                      >
                        Approve
                      </Button>
                    ) : null}
                    {review.status !== 'rejected' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<X className="size-3.5" />}
                        loading={busy === review.id}
                        onClick={() => moderate(review, 'rejected')}
                        className="text-red-600"
                      >
                        Reject
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Card className="flex items-start gap-3 p-5">
        <Inbox className="mt-0.5 size-4.5 shrink-0 text-ink-400" />
        <p className="text-[13px] leading-relaxed text-ink-600">
          Customers see a review only once it is approved. Rejected reviews stay in the database for audit but never
          count towards the product rating.
        </p>
      </Card>
    </div>
  )
}
