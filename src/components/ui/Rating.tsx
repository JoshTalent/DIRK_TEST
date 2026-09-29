import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Rating({
  value,
  size = 'sm',
  showValue = true,
  className,
}: {
  value: number
  size?: 'xs' | 'sm' | 'md'
  showValue?: boolean
  className?: string
}) {
  const px = size === 'xs' ? 12 : size === 'sm' ? 14 : 18
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - (i - 1)))
          return (
            <span key={i} className="relative inline-block" style={{ width: px, height: px }}>
              <Star size={px} className="absolute inset-0 text-ink-200" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={px} className="text-amber-400" fill="currentColor" />
              </span>
            </span>
          )
        })}
      </span>
      {showValue && <span className="text-xs font-semibold text-ink-700">{value.toFixed(1)}</span>}
    </span>
  )
}

export function RatingHistogram({
  data,
  onSelect,
}: {
  data: { rating: number; count: number }[]
  onSelect?: (rating: number | null) => void
}) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <button
          key={d.rating}
          type="button"
          onClick={() => onSelect?.(d.rating)}
          className="group flex w-full items-center gap-3 rounded-lg px-1 py-0.5 text-left transition hover:bg-ink-50"
        >
          <span className="flex w-12 shrink-0 items-center gap-1 text-xs font-medium text-ink-600">
            {d.rating}
            <Star size={11} className="text-amber-400" fill="currentColor" />
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
            <span
              className="block h-full rounded-full bg-amber-400 transition-all group-hover:bg-amber-500"
              style={{ width: `${(d.count / total) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-ink-500">{d.count}</span>
        </button>
      ))}
    </div>
  )
}
