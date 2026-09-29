import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Save, Trash2, Upload } from 'lucide-react'
import { createProduct, getCategories, getProductById, updateProduct } from '@/api/products'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Product, ProductSpec, ProductStatus } from '@/lib/types'
import { Badge, Button, Card, Field, Input, Select, Spinner, Textarea } from '@/components/ui'
import { ProductImage } from '@/components/product/ProductImage'
import { Panel } from '@/components/charts/Charts'
import { toast } from '@/store/toastStore'

const SUGGESTED_TAGS = [
  'wireless',
  'noise-cancelling',
  'usb-c',
  'fast-charge',
  'bluetooth',
  'waterproof',
  'recycled',
  'refurbished',
  'limited',
  'gift',
  'travel',
  'studio',
]

const STATUSES: { value: ProductStatus; label: string; hint: string }[] = [
  { value: 'active', label: 'Active', hint: 'Visible in the storefront and purchasable' },
  { value: 'draft', label: 'Draft', hint: 'Only visible to admins' },
  { value: 'archived', label: 'Archived', hint: 'Hidden, but kept for order history' },
]

type FormState = {
  name: string
  brand: string
  categoryId: string
  price: string
  compareAtPrice: string
  cost: string
  sku: string
  stock: string
  status: ProductStatus
  featured: boolean
  tagline: string
  description: string
  tags: string[]
  colors: string[]
  highlights: string[]
  specs: ProductSpec[]
}

const emptyForm = (categoryId: string): FormState => ({
  name: '',
  brand: '',
  categoryId,
  price: '',
  compareAtPrice: '',
  cost: '',
  sku: '',
  stock: '50',
  status: 'draft',
  featured: false,
  tagline: '',
  description: '',
  tags: [],
  colors: ['#111827'],
  highlights: [''],
  specs: [{ label: '', value: '' }],
})

function toForm(p: Product): FormState {
  return {
    name: p.name,
    brand: p.brand,
    categoryId: p.categoryId,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
    cost: String(p.cost),
    sku: p.sku,
    stock: String(p.stock),
    status: p.status,
    featured: p.featured,
    tagline: p.tagline,
    description: p.description,
    tags: p.tags,
    colors: p.colors,
    highlights: p.highlights,
    specs: p.specs,
  }
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const categories = getCategories()

  const [form, setForm] = useState<FormState>(() => emptyForm(categories[0]?.id ?? ''))
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm(categories[0]?.id ?? ''))
      setLoading(false)
      return
    }
    setLoading(true)
    getProductById(id!).then((p) => {
      if (p) setForm(toForm(p))
      else toast.error('Product not found')
      setLoading(false)
    })
  }, [id, isNew, categories])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const preview = useMemo<Product>(
    () => ({
      id: id ?? 'preview',
      slug: 'preview',
      name: form.name || 'Untitled product',
      brand: form.brand || 'Brand',
      categoryId: form.categoryId,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      cost: Number(form.cost) || 0,
      sku: form.sku || 'SKU-0000',
      stock: Number(form.stock) || 0,
      rating: 0,
      reviewCount: 0,
      sold: 0,
      status: form.status,
      tagline: form.tagline,
      description: form.description,
      highlights: form.highlights.filter(Boolean),
      specs: form.specs.filter((s) => s.label && s.value),
      tags: form.tags,
      colors: form.colors,
      createdAt: new Date().toISOString(),
      featured: form.featured,
    }),
    [form, id],
  )

  const price = Number(form.price) || 0
  const cost = Number(form.cost) || 0
  const marginPct = price ? Math.round(((price - cost) / price) * 100) : 0

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.brand.trim()) e.brand = 'Required'
    if (!form.categoryId) e.categoryId = 'Pick a category'
    if (price <= 0) e.price = 'Must be greater than 0'
    if (form.compareAtPrice && Number(form.compareAtPrice) <= price) e.compareAtPrice = 'Must be above the sale price'
    if (cost < 0) e.cost = 'Cannot be negative'
    if (cost > price && price > 0) e.cost = 'Cost above price loses money on every sale'
    if (!form.sku.trim()) e.sku = 'Required'
    if (Number(form.stock) < 0) e.stock = 'Cannot be negative'
    if (!form.tagline.trim()) e.tagline = 'Required — this shows under the product title'
    if (form.description.trim().length < 20) e.description = 'Write at least 20 characters'
    if (form.highlights.filter(Boolean).length === 0) e.highlights = 'Add at least one highlight'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (status?: ProductStatus) => {
    const next = { ...form, status: status ?? form.status }
    if (status) set('status', status)
    if (!validate()) return

    setSaving(true)
    try {
      const payload = {
        name: next.name.trim(),
        brand: next.brand.trim(),
        categoryId: next.categoryId,
        price,
        compareAtPrice: next.compareAtPrice ? Number(next.compareAtPrice) : null,
        cost,
        sku: next.sku.trim().toUpperCase(),
        stock: Number(next.stock),
        status: next.status,
        featured: next.featured,
        tagline: next.tagline.trim(),
        description: next.description.trim(),
        highlights: next.highlights.map((h) => h.trim()).filter(Boolean),
        specs: next.specs.filter((s) => s.label.trim() && s.value.trim()),
        tags: next.tags,
        colors: next.colors.length ? next.colors : ['#111827'],
      }

      if (isNew) {
        const created = await createProduct(payload)
        toast.success('Product created', status === 'active' ? 'It is live in the storefront.' : 'Saved as a draft.')
        navigate(`/admin/products/${created.id}`)
      } else {
        await updateProduct(id!, payload)
        toast.success('Product saved', payload.name)
      }
    } catch (err) {
      toast.error('Could not save', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-7 text-brand-600" />
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100">
            <ArrowLeft className="size-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink-900">{isNew ? 'New product' : form.name || 'Edit product'}</h1>
            <p className="text-[13px] text-ink-500">
              {isNew ? 'Drafts are invisible to shoppers until you publish.' : `SKU ${form.sku}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => void submit('draft')}>
            Save as draft
          </Button>
          <Button type="submit" loading={saving} icon={<Save className="size-4" />}>
            {isNew ? 'Create product' : 'Save changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Panel title="Basics" description="What shoppers see first.">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" required error={errors.name}>
                  <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Aurelia Studio Headphones" />
                </Field>
                <Field label="Brand" required error={errors.brand}>
                  <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Aurelia" />
                </Field>
              </div>
              <Field label="Category" required error={errors.categoryId}>
                <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tagline" required error={errors.tagline} hint="One line, shown under the title and in search results">
                <Input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={90} />
              </Field>
              <Field label="Description" required error={errors.description}>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What is it, who is it for, and what does it do better than the alternative?"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Highlights" description="Bulleted selling points. The first three appear on the product page.">
            <div className="space-y-2">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={h}
                    onChange={(e) => set('highlights', form.highlights.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={['Up to 40 hours on a charge', 'Adaptive noise cancelling', 'USB-C fast charge'][i] ?? 'Highlight'}
                  />
                  <button
                    type="button"
                    onClick={() => set('highlights', form.highlights.filter((_, j) => j !== i))}
                    className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {errors.highlights && <p className="text-xs text-red-600">{errors.highlights}</p>}
              <Button type="button" variant="ghost" size="sm" icon={<Plus className="size-3.5" />} onClick={() => set('highlights', [...form.highlights, ''])}>
                Add highlight
              </Button>
            </div>
          </Panel>

          <Panel
            title="Specifications"
            description="Label and value pairs shown in the spec table."
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Plus className="size-3.5" />}
                onClick={() => set('specs', [...form.specs, { label: '', value: '' }])}
              >
                Add row
              </Button>
            }
          >
            <div className="space-y-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="w-40"
                    value={s.label}
                    onChange={(e) => set('specs', form.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Battery life"
                  />
                  <Input
                    value={s.value}
                    onChange={(e) => set('specs', form.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    placeholder="40 hours"
                  />
                  <button
                    type="button"
                    onClick={() => set('specs', form.specs.filter((_, j) => j !== i))}
                    className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Preview">
            <ProductImage product={preview} className="mb-4 w-full rounded-2xl" />
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold tracking-widest text-brand-600 uppercase">{preview.brand}</p>
              <p className="text-base font-bold text-ink-900">{preview.name}</p>
              <p className="text-[13px] text-ink-500">{preview.tagline || 'Your tagline goes here'}</p>
              <div className="flex items-baseline gap-2 pt-1.5">
                <span className="text-xl font-extrabold text-ink-900">{money(preview.price)}</span>
                {preview.compareAtPrice && (
                  <span className="text-sm text-ink-400 line-through">{money(preview.compareAtPrice)}</span>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Pricing">
            <div className="space-y-4">
              <Field label="Price" required error={errors.price}>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </Field>
              <Field label="Compare-at price" error={errors.compareAtPrice} hint="Leave empty if it is not on sale">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={(e) => set('compareAtPrice', e.target.value)}
                />
              </Field>
              <Field label="Unit cost" error={errors.cost} hint="What you pay the supplier, excluding shipping">
                <Input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} />
              </Field>
              <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-[13px]">
                <span className="text-ink-500">Gross margin</span>
                <span className={cn('font-bold tabular-nums', marginPct < 25 ? 'text-red-600' : 'text-emerald-600')}>
                  {marginPct}% · {money(price - cost)}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Inventory & status">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SKU" required error={errors.sku}>
                  <Input className="font-mono" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                </Field>
                <Field label="Stock on hand" error={errors.stock}>
                  <Input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
                </Field>
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-ink-700">Visibility</span>
                <div className="space-y-1.5">
                  {STATUSES.map((s) => (
                    <label
                      key={s.value}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                        form.status === s.value ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200 hover:border-ink-300',
                      )}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={form.status === s.value}
                        onChange={() => set('status', s.value)}
                        className="mt-0.5 size-4 accent-brand-600"
                      />
                      <span>
                        <span className="block text-[13px] font-semibold text-ink-900">{s.label}</span>
                        <span className="block text-xs text-ink-500">{s.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set('featured', e.target.checked)}
                  className="mt-0.5 size-[18px] shrink-0 rounded-[6px] border-ink-300 accent-brand-600"
                />
                <span>
                  <span className="block text-sm leading-5 font-medium text-ink-800">Feature on the home page</span>
                  <span className="block text-xs text-ink-500">
                    Featured products are pinned to the top of the storefront hero rail.
                  </span>
                </span>
              </label>
            </div>
          </Panel>

          <Panel title="Colours" description="Used to render the generated product image and the swatch picker.">
            <div className="space-y-2">
              {form.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => set('colors', form.colors.map((x, j) => (j === i ? e.target.value : x)))}
                    className="size-10 cursor-pointer rounded-lg border border-ink-200 bg-white p-1"
                  />
                  <Input
                    className="font-mono text-[13px]"
                    value={c}
                    onChange={(e) => set('colors', form.colors.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                  <button
                    type="button"
                    onClick={() => set('colors', form.colors.filter((_, j) => j !== i))}
                    className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Plus className="size-3.5" />}
                onClick={() => set('colors', [...form.colors, '#1f40e0'])}
              >
                Add colour
              </Button>
            </div>
          </Panel>

          <Panel title="Tags" description="Tags power search and the related-products rail.">
            <div className="mb-3 flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const v = tagInput.trim().toLowerCase()
                    if (v && !form.tags.includes(v)) set('tags', [...form.tags, v])
                    setTagInput('')
                  }
                }}
                placeholder="Add a tag and press Enter"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t) => (
                <Badge key={t} tone="brand">
                  {t}
                  <button
                    type="button"
                    onClick={() => set('tags', form.tags.filter((x) => x !== t))}
                    className="ml-1 opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-ink-100 pt-4">
              {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t))
                .slice(0, 8)
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('tags', [...form.tags, t])}
                    className="rounded-lg border border-dashed border-ink-300 px-2.5 py-1 text-xs text-ink-500 transition hover:border-brand-400 hover:text-brand-700"
                  >
                    <Plus className="mr-0.5 inline size-3" />
                    {t}
                  </button>
                ))}
            </div>
          </Panel>

          <Card className="flex items-start gap-3 p-5">
            <Upload className="mt-0.5 size-4.5 shrink-0 text-ink-400" />
            <div>
              <p className="text-sm font-semibold text-ink-900">Photography</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                This demo renders product images from the colour swatches you pick, so no upload is needed. The
                production version would attach images to a CDN here.
              </p>
            </div>
          </Card>

          {!isNew && (
            <Button type="button" variant="ghost" full icon={<Check className="size-4" />} onClick={() => void submit('active')}>
              Publish this product
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
