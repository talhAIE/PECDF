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
        'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white',
        'shadow-[0_8px_32px_-16px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/80',
        className
      )}
    >
      {gradientTop && (
        <div
          className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
          aria-hidden
        />
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
