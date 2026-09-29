import type { ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToastStore } from '@/store/toastStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-ink-200', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition',
            value === t.value
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
          )}
        >
          {t.label}
          {t.count != null && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                value === t.value ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600',
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-xl bg-ink-100 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition',
            value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = 'md',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
}) {
  const h = size === 'sm' ? 'h-8' : 'h-10'
  const w = size === 'sm' ? 'w-8' : 'w-10'
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-ink-200 bg-white', h)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn('flex h-full items-center justify-center rounded-l-xl text-ink-600 transition hover:bg-ink-50 disabled:opacity-40', w)}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className={cn('flex-1 text-center text-sm font-semibold tabular-nums text-ink-900', size === 'sm' ? 'w-7' : 'w-9')}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn('flex h-full items-center justify-center rounded-r-xl text-ink-600 transition hover:bg-ink-50 disabled:opacity-40', w)}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

const toneStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-ink-200 bg-white text-ink-900',
} as const

const toneIcons = { success: CheckCircle2, error: AlertCircle, info: Info } as const

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-200 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = toneIcons[t.tone]
        return (
          <div
            key={t.id}
            className={cn(
              'animate-fade-up pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-ink-950/10',
              toneStyles[t.tone],
            )}
          >
            <Icon className="mt-0.5 size-4.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] opacity-80">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="opacity-50 transition hover:opacity-100" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
