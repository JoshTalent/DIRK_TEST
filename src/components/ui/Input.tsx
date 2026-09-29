import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const field =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none disabled:bg-ink-50 disabled:text-ink-400'

export function Field({
  label,
  hint,
  error,
  children,
  required,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink-700">
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  )
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, prefix, suffix, ...rest },
  ref,
) {
  const classes = cn(
    field,
    'h-11',
    !!prefix && 'pl-10',
    !!suffix && 'pr-10',
    invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/10',
    className,
  )

  if (!prefix && !suffix) {
    return <input ref={ref} className={classes} {...rest} />
  }

  return (
    <div className="relative flex items-center">
      {prefix && <span className="pointer-events-none absolute left-3.5 text-ink-400">{prefix}</span>}
      <input ref={ref} className={classes} {...rest} />
      {suffix && <span className="absolute right-3.5 text-ink-400">{suffix}</span>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(field, 'min-h-28 py-3 leading-relaxed', className)} {...rest} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(field, 'h-11 cursor-pointer appearance-none pr-10', className)}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  },
)

export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-[6px] border-ink-300 text-brand-600 accent-brand-600 focus:ring-2 focus:ring-brand-500/30"
        {...rest}
      />
      {label && (
        <label htmlFor={id} className="cursor-pointer text-sm leading-5 text-ink-700 select-none">
          {label}
        </label>
      )}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div>
          {label && <div className="text-sm font-medium text-ink-800">{label}</div>}
          {description && <div className="text-xs text-ink-500">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-ink-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
