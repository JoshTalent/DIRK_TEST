import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { SYSTEM_NAME } from '@/lib/brand'

export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-[10px] text-sm font-black',
          tone === 'dark' ? 'bg-ink-900 text-white' : 'bg-white text-ink-900',
        )}
      >
        T
      </span>
      <span
        className={cn(
          'text-[17px] font-extrabold tracking-tight',
          tone === 'dark' ? 'text-ink-900' : 'text-white',
        )}
      >
        {SYSTEM_NAME}
      </span>
    </Link>
  )
}
