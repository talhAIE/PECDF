import { Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Consistent page hero for app routes (matches dashboard brand: indigo/violet, Plus Jakarta on title).
 * @param {string} [hint] Friendly one-line tip (shown in an info strip below the description).
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  hint,
  icon: Icon,
  right,
  className = '',
  children,
}) {
  return (
    <header
      className={clsx(
        'relative mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_48px_-24px_rgba(15,23,42,0.15)] ring-1 ring-slate-100/90',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8 lg:p-9">
        <div className="flex min-w-0 gap-4">
          {Icon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/30">
              <Icon size={22} strokeWidth={2.2} />
            </span>
          )}
          <div className="min-w-0 space-y-2">
            {eyebrow && (
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600/90">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            {description && (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">{description}</p>
            )}
            {hint && (
              <div
                className="flex max-w-3xl gap-2.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 to-cyan-50/40 px-3.5 py-2.5 text-[13px] leading-snug text-slate-700 shadow-sm shadow-indigo-900/[0.03] sm:px-4 sm:py-3"
                role="note"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
                <span>{hint}</span>
              </div>
            )}
            {children}
          </div>
        </div>
        {right && <div className="shrink-0 sm:pt-1">{right}</div>}
      </div>
    </header>
  )
}
