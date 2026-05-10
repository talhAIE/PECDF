import { Info } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Editorial page hero — clear hierarchy; optional KPI column reads as instrumentation, not an afterthought.
 */
export default function PageHeader({
  eyebrow,
  title,
  /** Short supporting line; keep one sentence. */
  description,
  hint,
  icon: Icon,
  /** Narrow slot (figures, selectors) — given a framed treatment on large screens */
  right,
  className = '',
  children,
}) {
  const hasAside = Boolean(right)

  return (
    <header
      className={clsx(
        'relative mb-10 overflow-hidden rounded-[1.375rem] border border-slate-200/80 bg-white',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_22px_56px_-28px_rgba(15,23,42,0.14)]',
        className
      )}
    >
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.35rem] bg-slate-900" aria-hidden />

      <div
        className={clsx(
          'relative grid gap-8 p-6 sm:p-8 lg:pl-[2rem]',
          hasAside && 'lg:grid-cols-[minmax(0,1fr)_minmax(min-content,280px)] lg:items-center lg:gap-10 xl:gap-14'
        )}
      >
        <div className="flex min-w-0 gap-4 sm:gap-5">
          {Icon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-slate-900 text-white shadow-[0_6px_20px_-4px_rgba(15,23,42,0.35)] ring-4 ring-slate-900/10">
              <Icon size={24} strokeWidth={1.85} />
            </span>
          )}
          <div className="min-w-0 space-y-3">
            {eyebrow && (
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display max-w-[42rem] text-[1.875rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2.05rem] sm:leading-[1.12]">
              {title}
            </h1>
            {description && (
              <p className="max-w-[42rem] text-[0.9625rem] leading-[1.55] text-slate-600 sm:text-[1rem]">
                {description}
              </p>
            )}
            {hint && (
              <div
                className="flex max-w-[42rem] gap-3 rounded-[0.65rem] border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white py-3 pl-3.5 pr-4 text-[13px] leading-snug text-slate-700 shadow-sm shadow-amber-900/[0.04]"
                role="note"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                  <Info className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
                </span>
                <span className="pt-0.5">{hint}</span>
              </div>
            )}
            {children}
          </div>
        </div>

        {hasAside && (
          <aside className="flex w-full flex-col justify-center border-t border-slate-100 pt-6 sm:pt-6 lg:border-t-0 lg:border-l lg:border-slate-100 lg:pt-0 lg:pl-10">
            <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">{right}</div>
          </aside>
        )}
      </div>
    </header>
  )
}
