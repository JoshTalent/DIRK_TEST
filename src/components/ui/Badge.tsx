import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'brand' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'teal'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const ORDER_TONES = {
  pending: 'amber',
  processing: 'blue',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'neutral',
  refunded: 'red',
} as const

const ORDER_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
} as const

export function OrderStatusBadge({ status }: { status: keyof typeof ORDER_TONES }) {
  return (
    <Badge tone={ORDER_TONES[status]}>
      <span className="size-1.5 rounded-full bg-current" />
      {ORDER_LABELS[status]}
    </Badge>
  )
}

const PAY_TONES = { paid: 'green', unpaid: 'amber', refunded: 'blue', failed: 'red' } as const
const PAY_LABELS = { paid: 'Paid', unpaid: 'Awaiting payment', refunded: 'Refunded', failed: 'Failed' } as const

export function PaymentStatusBadge({ status }: { status: keyof typeof PAY_TONES }) {
  return <Badge tone={PAY_TONES[status]}>{PAY_LABELS[status]}</Badge>
}

const REVIEW_TONES = { pending: 'amber', approved: 'green', rejected: 'red' } as const
const REVIEW_LABELS = { pending: 'Awaiting moderation', approved: 'Published', rejected: 'Rejected' } as const

export function ReviewStatusBadge({ status }: { status: keyof typeof REVIEW_TONES }) {
  return <Badge tone={REVIEW_TONES[status]}>{REVIEW_LABELS[status]}</Badge>
}

export { ORDER_LABELS, PAY_LABELS }
