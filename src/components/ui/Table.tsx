import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { EmptyState, Skeleton } from './Card'
import { Button } from './Button'
import { Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  headerClassName?: string
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  loading,
  skeletonRows = 6,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  onRowClick,
  rowClassName,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
}) {
  if (loading) {
    return (
      <div className="divide-y divide-ink-100">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-9 rounded-full" />
            {columns.map((c) => (
              <Skeleton key={c.key} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return (
      <EmptyState
        icon={<Inbox className="size-6" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-100">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-5 py-3 text-[11px] font-semibold tracking-wide text-ink-500 uppercase',
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-ink-50',
                rowClassName?.(row),
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-5 py-3.5 text-sm text-ink-700',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({
  page,
  pages,
  onChange,
  total,
}: {
  page: number
  pages: number
  onChange: (p: number) => void
  total?: number
}) {
  if (pages <= 1) {
    return total != null ? (
      <p className="px-1 py-3 text-[13px] text-ink-500">
        Showing <span className="font-semibold text-ink-800">{total}</span> results
      </p>
    ) : null
  }

  const window: (number | '…')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) window.push(i)
    else if (window[window.length - 1] !== '…') window.push('…')
  }

  return (
    <nav className="flex items-center justify-between gap-4 pt-6">
      {total != null && (
        <p className="text-[13px] text-ink-500">
          Page <span className="font-semibold text-ink-800">{page}</span> of {pages}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
        {window.map((w, i) =>
          w === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-ink-400">
              …
            </span>
          ) : (
            <button
              key={w}
              onClick={() => onChange(w)}
              className={cn(
                'size-10 rounded-xl text-sm font-medium transition',
                w === page ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              {w}
            </button>
          ),
        )}
        <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
