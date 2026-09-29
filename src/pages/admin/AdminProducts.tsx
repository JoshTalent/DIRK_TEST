import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2, Star, Eye, EyeOff, PackageSearch, X } from 'lucide-react'
import { deleteProduct, getProductMap, listProducts, updateProduct, type ProductQuery } from '@/api/products'
import { getCategories } from '@/api/products'
import { money, compactNum } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Product, ProductStatus } from '@/lib/types'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Rating,
  Select,
  Table,
  type Column,
} from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { toast } from '@/store/toastStore'
import { Panel } from '@/components/charts/Charts'

type Row = Product

const PER_PAGE = 10

const STATUS_TONE: Record<ProductStatus, 'green' | 'amber' | 'neutral'> = {
  active: 'green',
  draft: 'amber',
  archived: 'neutral',
}

export default function AdminProducts({ categoryView = false }: { categoryView?: boolean }) {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)

  const query: ProductQuery = useMemo(
    () => ({
      q: params.get('q') ?? '',
      category: params.get('category') ?? '',
      sort: (params.get('sort') as ProductQuery['sort']) ?? 'newest',
      page: Number(params.get('page') ?? 1),
      perPage: PER_PAGE,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.toString()],
  )

  const load = () => {
    setRows(null)
    listProducts(query).then((res) => {
      setRows(res.items)
      setTotal(res.total)
      setPages(res.pages)
    })
  }

  useEffect(load, [query])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const toggle = async (p: Product, patch: Partial<Product>, message: string) => {
    await updateProduct(p.id, patch)
    setRows((list) => list?.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) ?? null)
    toast.success(message, p.name)
  }

  const remove = async () => {
    if (!confirmDelete) return
    setBusy(true)
    await deleteProduct(confirmDelete.id)
    setBusy(false)
    toast.success('Product deleted', confirmDelete.name)
    setConfirmDelete(null)
    load()
  }

  const columns: Column<Row>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <ProductImage product={p} className="size-11 shrink-0 rounded-lg" iconSize="sm" />
          <div className="min-w-0">
            <Link to={`/product/${p.slug}`} className="block truncate text-[13px] font-semibold text-ink-900 hover:text-brand-700">
              {p.name}
            </Link>
            <p className="truncate text-xs text-ink-500">
              {p.brand} · <span className="font-mono text-[11px]">{p.sku}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      cell: (p) => (
        <div className="whitespace-nowrap">
          <span className="text-[13px] font-semibold text-ink-900">{money(p.price)}</span>
          {p.compareAtPrice && <span className="ml-1.5 text-xs text-ink-400 line-through">{money(p.compareAtPrice)}</span>}
        </div>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      cell: (p) => {
        const margin = Math.round(((p.price - p.cost) / p.price) * 100)
        return (
          <span className={cn('text-[13px] font-medium tabular-nums', margin < 25 ? 'text-red-600' : 'text-emerald-600')}>
            {margin}%
          </span>
        )
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      cell: (p) => (
        <span className={cn('text-[13px] font-semibold tabular-nums', p.stock === 0 ? 'text-red-600' : p.stock < 10 ? 'text-amber-600' : 'text-ink-800')}>
          {p.stock}
        </span>
      ),
    },
    {
      key: 'sold',
      header: 'Sold',
      align: 'right',
      cell: (p) => <span className="text-[13px] tabular-nums text-ink-600">{compactNum(p.sold)}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      cell: (p) => (p.reviewCount ? <Rating value={p.rating} showValue={false} /> : <span className="text-xs text-ink-400">—</span>),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
          {p.featured && <Badge tone="brand">Featured</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      headerClassName: 'w-28',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title={p.featured ? 'Remove from featured' : 'Mark as featured'}
            onClick={() => toggle(p, { featured: !p.featured }, p.featured ? 'Removed from featured' : 'Marked as featured')}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-amber-500"
          >
            <Star className={cn('size-4', p.featured && 'fill-current text-amber-400')} />
          </button>
          <button
            title={p.status === 'active' ? 'Unpublish' : 'Publish'}
            onClick={() => toggle(p, { status: p.status === 'active' ? 'draft' : 'active' }, p.status === 'active' ? 'Moved to drafts' : 'Published')}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
          >
            {p.status === 'active' ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
          <Link
            to={`/admin/products/${p.id}`}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
            title="Edit"
          >
            <Pencil className="size-4" />
          </Link>
          <button
            onClick={() => setConfirmDelete(p)}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">{categoryView ? 'Categories' : 'Products'}</h1>
          <p className="text-[13px] text-ink-500">
            {total} products in the catalog · {Object.keys(getProductMap()).length} total including drafts
          </p>
        </div>
        <ButtonLink to="/admin/products/new" icon={<Plus className="size-4" />}>
          New product
        </ButtonLink>
      </div>

      {categoryView && <CategoryManager />}

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setParam('q', search)}
              placeholder="Search name, brand, tag…"
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  setParam('q', '')
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 hover:bg-ink-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Select value={query.sort} onChange={(e) => setParam('sort', e.target.value)} className="w-44">
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
            <option value="bestselling">Best selling</option>
            <option value="rating">Highest rated</option>
          </Select>
          <Button variant="outline" onClick={() => setParam('q', search)}>
            Search
          </Button>
        </div>

        <Table
          columns={columns}
          rows={rows ?? []}
          rowKey={(p) => p.id}
          loading={rows === null}
          skeletonRows={8}
          emptyTitle="No products match"
          emptyDescription="Try clearing the search or filters."
          emptyAction={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setParams(new URLSearchParams(), { replace: true })
              }}
            >
              Clear filters
            </Button>
          }
        />

        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
          <p className="text-[13px] text-ink-500">
            Showing {(rows?.length ?? 0).toLocaleString()} of {total.toLocaleString()}
          </p>
          <Pagination page={query.page ?? 1} pages={pages} onChange={(p) => setParam('page', String(p))} />
        </div>
      </Panel>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete product?"
        description={`${confirmDelete?.name} will be removed from the catalog and removed from any carts. Past orders keep their record.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete permanently
            </Button>
          </>
        }
      />
    </div>
  )
}

function CategoryManager() {
  const categories = getCategories()
  const productMap = getProductMap()
  const counts = new Map<string, number>()
  for (const p of Object.values(productMap)) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((c) => {
        const count = counts.get(c.id) ?? 0
        const revenue = Object.values(productMap)
          .filter((p) => p.categoryId === c.id)
          .reduce((s, p) => s + p.price * Math.max(1, Math.round(p.sold / 40)), 0)
        return (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{c.name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-500">{c.tagline}</p>
              </div>
              <Badge tone="neutral">{count} items</Badge>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
              <span className="font-mono">/{c.slug}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-[13px]">
              <span className="text-ink-500">{count} products</span>
              <span className="font-semibold text-ink-900">{money(revenue)} est.</span>
            </div>
            <Link
              to={`/admin/categories?category=${c.slug}`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2 text-[13px] font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              <PackageSearch className="size-3.5" /> View products
            </Link>
          </Card>
        )
      })}
      {categories.length === 0 && <EmptyState icon={<PackageSearch className="size-6" />} title="No categories" />}
    </div>
  )
}
