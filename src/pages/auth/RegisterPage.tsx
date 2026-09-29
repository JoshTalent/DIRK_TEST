import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Check, ArrowRight } from 'lucide-react'
import { Button, Field, Input } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { AuthFooterLink, AuthShell } from './AuthShell'

function strength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const LABELS = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent']
const BARS = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const user = useAuthStore((s) => s.user)

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const score = useMemo(() => strength(form.password), [form.password])
  const passwordIssues = [
    { ok: form.password.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(form.password), label: 'One uppercase letter' },
    { ok: /[0-9]/.test(form.password), label: 'One number' },
  ]

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/account'} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Those passwords do not match.')
      return
    }
    if (!accepted) {
      setError('Please accept the terms to continue.')
      return
    }
    setPending(true)
    try {
      await register(form)
      toast.success('Account created', 'Welcome to TEST — your 15% code is on its way.')
      navigate('/account', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.')
    } finally {
      setPending(false)
    }
  }

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <AuthShell
      title="Create your account"
      subtitle="Faster checkout, order tracking and 15% off your first order."
      footer={
        <>
          Already have an account?{' '}
          <AuthFooterLink to="/login">Sign in</AuthFooterLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200 ring-inset">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Full name" required>
          <Input required autoComplete="name" placeholder="Alex Moreau" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        </Field>

        <Field label="Email address" required>
          <Input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email')(e.target.value)} />
        </Field>

        <Field label="Mobile number" hint="Used only for delivery updates">
          <Input required placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
        </Field>

        <Field label="Password" required>
          <div className="relative">
            <Input
              required
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => set('password')(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {form.password && (
          <div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn('h-1 flex-1 rounded-full transition', i < score ? BARS[score] : 'bg-ink-200')} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-xs font-medium text-ink-600">Strength: {LABELS[score]}</span>
              {passwordIssues.map((i) => (
                <span key={i.label} className={cn('flex items-center gap-1 text-xs', i.ok ? 'text-emerald-600' : 'text-ink-400')}>
                  <Check className="size-3" /> {i.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <Field label="Confirm password" required error={form.confirm && form.confirm !== form.password ? 'Passwords do not match' : undefined}>
          <Input
            required
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set('confirm')(e.target.value)}
          />
        </Field>

        <label className="flex items-start gap-2.5 text-[13px] leading-5 text-ink-600">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-[18px] rounded-[6px] accent-brand-600" />
          <span>
            I agree to the{' '}
            <Link to="/help" className="font-semibold text-brand-700 hover:underline">
              terms of service
            </Link>{' '}
            and{' '}
            <Link to="/help" className="font-semibold text-brand-700 hover:underline">
              privacy policy
            </Link>
            .
          </span>
        </label>

        <Button type="submit" full size="lg" loading={pending} icon={<ArrowRight className="size-4" />}>
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
