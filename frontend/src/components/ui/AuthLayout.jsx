import { Link } from 'react-router-dom'
import { BarChart2 } from 'lucide-react'

/** Shared chrome for login / register — matches app brand */
export default function AuthLayout({ children, subtitle = 'Pakistan Export Demand Forecasting' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.15),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-violet-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <p className="mb-6 text-center">
          <Link to="/" className="text-sm font-medium text-slate-500 transition hover:text-indigo-600">
            ← Back to home
          </Link>
        </p>
        <div className="mb-10 text-center">
          <Link
            to="/"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/35 transition hover:opacity-95"
            aria-label="PECDF home"
          >
            <BarChart2 size={28} strokeWidth={2.25} />
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">PECDF</h1>
          <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
        </div>

        <div className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-8 pt-10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-100 backdrop-blur-sm supports-[backdrop-filter]:bg-white/85">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
          {children}
          {import.meta.env.PROD && (
            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
              Hosted on free tier? Your API can take{' '}
              <span className="font-medium text-slate-600">about 30–90 seconds</span> to wake after idle — keep this tab
              open until sign-in finishes.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
