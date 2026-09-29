import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { CREDIT } from '@/lib/brand'

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-ink-200/80 bg-white shadow-sm shadow-ink-200/40', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white">
      <Skeleton className="aspect-4/3 rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Avatar({
  name,
  color = '#1f40e0',
  size = 40,
  className,
}: {
  name: string
  color?: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  )
}

export function Spinner({
  className,
  label = 'Loading',
  credit = true,
}: {
  className?: string
  label?: string
  credit?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2" role="status" aria-live="polite">
      <svg className={cn('size-5 animate-spin text-brand-600', className)} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="text-[11px] leading-tight font-medium text-ink-400">
        {label}
        {credit && (
          <>
            {' · '}
            <span className="text-ink-500">{CREDIT}</span>
          </>
        )}
      </p>
    </div>
  )
}

export function Progress({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'green' | 'amber' | 'red' }) {
  const tones = { brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' }
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
