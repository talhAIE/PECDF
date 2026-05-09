import { clsx } from 'clsx'

/**
 * Consistent page hero for app routes (matches dashboard brand: indigo/violet, Plus Jakarta on title).
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
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
            {children}
          </div>
        </div>
        {right && <div className="shrink-0 sm:pt-1">{right}</div>}
      </div>
    </header>
  )
}
