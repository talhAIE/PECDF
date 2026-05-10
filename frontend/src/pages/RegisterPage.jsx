import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import AuthLayout from '../components/ui/AuthLayout'
import { getErrorMessage } from '../utils/apiError'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const data = await register(email, password, fullName)
      setAuth(data.access_token, {
        email: data.email ?? email,
        user_id: data.user_id,
        full_name: (data.full_name || fullName).trim() || null,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-lg font-bold text-slate-900">Create account</h2>
      <p className="mt-1 text-sm text-slate-500">Join PECDF to access forecasts and reports.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
          <input
            type="text"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            placeholder="Min. 6 characters"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
          >
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
