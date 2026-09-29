import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const CHART_COLORS = [
  '#1f40e0',
  '#0f766e',
  '#f59e0b',
  '#7c3aed',
  '#e11d48',
  '#0891b2',
  '#65a30d',
  '#c2410c',
  '#4f46e5',
  '#db2777',
]

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }[]
  label?: string | number
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-ink-200 bg-white/97 px-3 py-2 shadow-lg shadow-ink-950/10 backdrop-blur">
      {label != null && <p className="mb-1 text-[11px] font-semibold text-ink-500">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-ink-600">{p.name}</span>
            <span className="ml-auto font-semibold text-ink-900 tabular-nums">
              {formatter ? formatter(Number(p.value), String(p.name)) : Number(p.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-ink-200 bg-white', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
        <div className="min-w-0">
          {title && <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>}
          {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function Kpi({
  label,
  value,
  delta,
  icon,
  tone = 'brand',
  hint,
}: {
  label: string
  value: string
  delta?: number
  icon: ReactNode
  tone?: 'brand' | 'green' | 'amber' | 'purple'
  hint?: string
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-violet-50 text-violet-600',
  }
  const up = (delta ?? 0) >= 0

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span className={cn('flex size-10 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>
        {delta != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold',
              up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
            )}
          >
            {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
      <p className="mt-0.5 text-[13px] font-medium text-ink-600">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}
