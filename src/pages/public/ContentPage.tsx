import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  Leaf,
  HeartHandshake,
  Microscope,
  Recycle,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  ChevronDown,
  Send,
} from 'lucide-react'
import { Button, Card, Checkbox, Field, Input, Textarea } from '@/components/ui'
import { toast } from '@/store/toastStore'

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Orders placed before 2pm local time are dispatched the same day. Standard delivery lands in 3–5 business days, express in 1–2. Anything over RWF 99 ships free on express.',
  },
  {
    q: 'What is your returns policy?',
    a: 'Thirty days from delivery, no questions asked. A prepaid label is in every box — print it, drop the parcel off, and we refund within two business days of it reaching the warehouse.',
  },
  {
    q: 'Is the warranty really two years?',
    a: 'Yes, on every product we sell, including accessories. It covers manufacturing defects and component failure. Accidental damage is not covered, but we sell repair parts at cost.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We ship to 34 countries. Duties are calculated at checkout so there is nothing to pay on delivery. Delivery outside the US typically takes 5–9 business days.',
  },
  {
    q: 'Can I pay in instalments?',
    a: 'Yes — four interest-free payments at checkout on any order over RWF 75. We never charge a fee and there is no credit check.',
  },
  {
    q: 'How do I track a return?',
    a: 'Start the return from your account portal under Orders, drop the parcel at any carrier point, and we will email you a refund receipt the moment it is scanned.',
  },
]

export default function ContentPage({ kind }: { kind: 'about' | 'contact' | 'help' }) {
  return (
    <div>
      {kind === 'about' && <About />}
      {kind === 'contact' && <Contact />}
      {kind === 'help' && <Help />}
    </div>
  )
}

function About() {
  const values = [
    { icon: Microscope, title: 'Two-year soak test', body: 'Nothing ships until it has lived in our lab for 24 months. That is why our failure rate sits under 1%.' },
    { icon: Recycle, title: 'Repairable by default', body: 'Spare parts and manuals stay available for seven years after a product is discontinued.' },
    { icon: HeartHandshake, title: 'Honest markdowns', body: 'Our "was" prices are the price we genuinely charged in the last 90 days, not an inflated anchor.' },
    { icon: Leaf, title: 'Plastic-free packing', body: 'Moulded fibre, paper tape, and a box you can actually recycle in your kerb.' },
  ]

  return (
    <div>
      <section className="bg-ink-950 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Compass className="mx-auto size-8 text-white/60" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">We only sell what we would keep</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            TEST started in 2016 as a two-person workshop fixing audio gear. We kept buying the same products, testing
            them against each other, and putting the list on a website. The list became the company.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <Card key={v.title} className="p-6">
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <v.icon className="size-5" />
              </span>
              <h3 className="text-lg font-semibold text-ink-900">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{v.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">By the numbers</h2>
            <p className="mt-3 leading-relaxed text-ink-600">
              We are deliberately small. Four hundred products, four warehouses, and a buying team that physically
              handles every sample that arrives on the loading dock.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                ['2016', 'Founded'],
                ['64', 'Products'],
                ['21.4k', 'Reviews'],
                ['1.2%', 'Return rate'],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="text-2xl font-extrabold text-ink-900">{n}</p>
                  <p className="text-[13px] text-ink-500">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-ink-900">How the lab works</h3>
            <ol className="mt-4 space-y-4">
              {[
                'Every product runs continuously for 24 months in rotating duty cycles.',
                'Battery cells are tested to 1,000 full charge cycles, not the 300 most brands claim.',
                'Waterproofing is verified at 2× the rated depth, in salt water rather than fresh.',
                'Any product with a single field failure below 500 units is pulled from sale.',
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-ink-600">{step}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>
    </div>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', order: '', message: '' })

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Talk to a human</h1>
        <p className="mt-3 text-ink-600">
          Our support team is six people, not a script. Median first reply is 47 minutes during business hours.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          {sent ? (
            <div className="py-12 text-center">
              <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Send className="size-6" />
              </span>
              <h2 className="text-xl font-bold text-ink-900">Message sent</h2>
              <p className="mx-auto mt-2 max-w-sm text-ink-500">
                Reference <span className="font-mono font-semibold">SUP-{Math.floor(Math.random() * 9000 + 1000)}</span>. We
                will reply to {form.email} shortly.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => setSent(false)}>
                Send another
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
                toast.success('Message sent', 'We usually reply within an hour.')
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" required>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Email" required>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
              </div>
              <Field label="Order number" hint="Optional — helps us find your order faster">
                <Input placeholder="AU-10042" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </Field>
              <Field label="How can we help?" required>
                <Textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </Field>
              <Checkbox label="Send me occasional product notes (max 1 email a month)" />
              <Button type="submit">Send message</Button>
            </form>
          )}
        </Card>

        <div className="space-y-4">
          {[
            { icon: Mail, title: 'Email', body: 'support@aurelia.example', sub: 'Replies within 4 business hours' },
            { icon: Phone, title: 'Phone', body: '+1 (614) 555-0199', sub: 'Mon–Sat, 8am–8pm ET' },
            { icon: MessageSquare, title: 'Live chat', body: 'Bottom-right widget', sub: 'Median wait 2 minutes' },
            { icon: MapPin, title: 'Warehouse', body: '2140 Alum Creek Dr', sub: 'Columbus, OH 43215' },
          ].map((c) => (
            <Card key={c.title} className="flex items-start gap-3 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
                <c.icon className="size-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{c.title}</p>
                <p className="text-[13px] text-ink-700">{c.body}</p>
                <p className="text-xs text-ink-400">{c.sub}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function Help() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Help centre</h1>
      <p className="mt-3 text-ink-600">The eight questions we get most, answered properly.</p>

      <div className="mt-8 divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-ink-900">{f.q}</span>
              <ChevronDown className={`size-4 shrink-0 text-ink-400 transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-ink-600">{f.a}</p>}
          </div>
        ))}
      </div>

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Still stuck?</h2>
          <p className="text-sm text-ink-500">Track an order or talk to a person — whichever you need.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/track" className="inline-flex h-11 items-center rounded-xl border border-ink-200 px-5 text-sm font-medium text-ink-800 hover:bg-ink-50">
            Track order
          </Link>
          <Link to="/contact" className="inline-flex h-11 items-center rounded-xl bg-ink-900 px-5 text-sm font-medium text-white hover:bg-ink-800">
            Contact us
          </Link>
        </div>
      </Card>
    </div>
  )
}
