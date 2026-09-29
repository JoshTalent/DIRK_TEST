import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-600/20',
  secondary: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
  outline: 'border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  dark: 'bg-ink-950 text-white hover:bg-ink-900',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
  icon: 'h-10 w-10 justify-center',
}

const base =
  'inline-flex items-center rounded-xl font-medium transition-all duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  full?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, full, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], full && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
})

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  full,
  className,
  children,
}: {
  to: string
  variant?: Variant
  size?: Size
  icon?: ReactNode
  full?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={cn(base, variants[variant], sizes[size], full && 'w-full', className)}>
      {icon}
      {children}
    </Link>
  )
}
