import { Link } from 'react-router-dom'
import { BarChart2 } from 'lucide-react'

/** Shared chrome for login / register — matches in-app slate editorial system */
export default function AuthLayout({ children, subtitle = 'Pakistan export intelligence' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f4f2] px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,rgba(15,23,42,0.05),transparent_50%)]"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <p className="mb-6 text-center">
          <Link to="/" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
            ← Back to home
          </Link>
        </p>
        <div className="mb-10 text-center">
          <Link
            to="/"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-opacity hover:opacity-95"
            aria-label="PECDF home"
          >
            <BarChart2 size={28} strokeWidth={2.25} />
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950">PECDF</h1>
          <p className="mt-1.5 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="relative rounded-2xl border border-slate-200/80 bg-white p-8 pt-9 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-28px_rgba(15,23,42,0.14)]">
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-slate-900" aria-hidden />
          {children}
          {import.meta.env.PROD && (
            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-[11px] leading-relaxed text-slate-500">
              First request after idle can take <span className="font-medium text-slate-700">~30–90s</span> on free
              hosting — keep this tab open until sign-in completes.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
