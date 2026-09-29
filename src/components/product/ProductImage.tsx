import { Headphones, Watch, Laptop, Camera, Home, Gamepad2, BatteryCharging, Briefcase } from 'lucide-react'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/cn'

const ICONS: Record<string, typeof Headphones> = {
  'c-audio': Headphones,
  'c-wear': Watch,
  'c-compute': Laptop,
  'c-camera': Camera,
  'c-home': Home,
  'c-gaming': Gamepad2,
  'c-power': BatteryCharging,
  'c-bags': Briefcase,
}

const SCENES: { from: string; to: string; spot: string }[] = [
  { from: '#f1f5f9', to: '#e2e8f0', spot: '#c7d2fe' },
  { from: '#faf5f0', to: '#f0e6dc', spot: '#fed7aa' },
  { from: '#f0f7f5', to: '#dceee9', spot: '#99f6e4' },
  { from: '#f6f2fa', to: '#e9dff3', spot: '#e9d5ff' },
  { from: '#f2f4f8', to: '#e4e8f0', spot: '#bfdbfe' },
  { from: '#f8f4f4', to: '#f0e4e4', spot: '#fecaca' },
]

function hash(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

export function ProductImage({
  product,
  className,
  selectedColor,
  iconSize = 'lg',
}: {
  product: Pick<Product, 'id' | 'categoryId' | 'brand'>
  className?: string
  selectedColor?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const h = hash(product.id + product.brand)
  const scene = SCENES[h % SCENES.length]
  const Icon = ICONS[product.categoryId] ?? Home
  const sizes = { sm: 24, md: 40, lg: 64, xl: 96 }
  const px = sizes[iconSize]
  const angle = (h >> 3) % 90

  return (
    <div
      className={cn('relative flex items-center justify-center overflow-hidden', className)}
      style={{ backgroundImage: `linear-gradient(${angle + 120}deg, ${scene.from}, ${scene.to})` }}
    >
      <div
        className="absolute -top-1/4 -right-1/4 size-3/4 rounded-full opacity-70 blur-2xl"
        style={{ backgroundColor: scene.spot }}
      />
      <div
        className="absolute -bottom-1/3 -left-1/5 size-2/3 rounded-full opacity-50 blur-2xl"
        style={{ backgroundColor: scene.spot, filter: 'brightness(1.1)' }}
      />
      {selectedColor && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-[0.07]"
          style={{ backgroundColor: selectedColor }}
        />
      )}
      <Icon
        style={{ width: px, height: px }}
        className="relative text-ink-900/25 drop-shadow-sm"
        strokeWidth={1.25}
      />
      <div className="absolute inset-0 ring-1 ring-ink-950/5 ring-inset" />
    </div>
  )
}

export function CategoryIcon({
  categoryId,
  className,
  strokeWidth = 1.75,
}: {
  categoryId: string
  className?: string
  strokeWidth?: number
}) {
  const Icon = ICONS[categoryId] ?? Home
  return <Icon className={className} strokeWidth={strokeWidth} />
}