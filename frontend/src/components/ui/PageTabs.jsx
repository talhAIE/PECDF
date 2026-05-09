import { clsx } from 'clsx'

/** Underline tabs — indigo active state aligned with app chrome */
export default function PageTabs({ tabs, active, onChange, className = '' }) {
  return (
    <div
      className={clsx(
        'mb-8 flex flex-wrap gap-1 border-b border-slate-200/90',
        className
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={clsx(
            '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:px-5',
            active === t.id
              ? 'border-indigo-600 font-semibold text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
