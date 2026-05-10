import { clsx } from 'clsx'

/** Standard elevated panel — use across Forecast, Scenarios, Explorer, etc. */
export default function SurfaceCard({
  children,
  className = '',
  padding = true,
  gradientTop = false,
}) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_40px_-18px_rgba(15,23,42,0.08)]',
        className
      )}
    >
      {gradientTop && (
        <div className="h-0.5 w-full shrink-0 bg-slate-900" aria-hidden />
      )}
      {padding ? (
        <div
          className={clsx(
            !gradientTop && 'p-5 sm:p-6',
            gradientTop && 'p-5 pt-4 sm:p-6 sm:pt-5'
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
