import { Compass } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFoundPage({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? 'flex min-h-[60vh] flex-col items-center justify-center p-8 text-center' : 'mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center'}>
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        <Compass className="size-7" />
      </span>
      <p className="text-[13px] font-bold tracking-widest text-ink-400 uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">This page took a wrong turn</h1>
      <p className="mt-3 max-w-md text-ink-500">
        The link may be old, or the product may have been retired. The catalogue is a good place to pick things back up.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={() => (window.location.href = '/')}>Back to home</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/shop')}>
          Browse products
        </Button>
      </div>
    </div>
  )
}
