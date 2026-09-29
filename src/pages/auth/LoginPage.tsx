import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import { Button, Checkbox, Field, Input } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { AuthFooterLink, AuthShell, DemoAccounts } from './AuthShell'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const next = params.get('next') ?? (location.state as { from?: string } | null)?.from ?? '/account'

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/account'} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      const signedIn = await login(email, password)
      toast.success(`Welcome back, ${signedIn.name.split(' ')[0]}`)
      navigate(signedIn.role === 'admin' ? '/admin' : next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in.')
    } finally {
      setPending(false)
    }
  }

  const fill = (e: string, p: string) => {
    setEmail(e)
    setPassword(p)
  }

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle="Track orders, save favourites and check out faster."
      footer={
        <>
          New to TEST?{' '}
          <AuthFooterLink to="/register">Create an account</AuthFooterLink>
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

        <Field label="Email address" required>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" required>
          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="flex items-center justify-between">
          <Checkbox label="Keep me signed in" defaultChecked />
          <button type="button" onClick={() => toast.info('Password reset', 'In a real store this would email you a reset link.')} className="text-[13px] font-semibold text-brand-700 hover:underline">
            Forgot password?
          </button>
        </div>

        <Button type="submit" full size="lg" loading={pending} icon={<ArrowRight className="size-4" />}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-200" />
          <span className="text-xs text-ink-400">or use a demo account</span>
          <span className="h-px flex-1 bg-ink-200" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => fill('customer@demo.com', 'demo1234')}>
            Customer
          </Button>
          <Button variant="outline" onClick={() => fill('admin@demo.com', 'admin1234')}>
            Admin
          </Button>
        </div>
        <DemoAccounts />
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        Just browsing?{' '}
        <Link to="/shop" className="font-semibold text-ink-700 hover:underline">
          Continue as guest
        </Link>
      </p>
    </AuthShell>
  )
}
