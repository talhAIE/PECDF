import { clsx } from 'clsx'

const LEVELS = {
  high:     { label: 'High',          width: 'w-full',   bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-100' },
  moderate: { label: 'Moderate',      width: 'w-2/3',    bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' },
  low:      { label: 'Low',           width: 'w-1/3',    bar: 'bg-red-400',   text: 'text-red-700',   bg: 'bg-red-100'   },
  very_low: { label: 'Very Low ⚠',    width: 'w-1/6',    bar: 'bg-red-600',   text: 'text-red-700',   bg: 'bg-red-100'   },
}

export function getConfidenceLevel(mape, horizon = 1) {
  if (mape > 80)  return 'very_low'
  if (mape > 35 || horizon > 9)  return 'low'
  if (mape > 20 || horizon > 4)  return 'moderate'
  return 'high'
}

export default function ConfidenceBar({ level, mape, horizon, showLabel = true, className = '' }) {
  const resolvedLevel = level ?? getConfidenceLevel(mape, horizon)
  const c = LEVELS[resolvedLevel] ?? LEVELS.moderate

  return (
    <div className={clsx('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Forecast Confidence</span>
          <span className={clsx('text-xs font-semibold', c.text)}>{c.label}</span>
        </div>
      )}
      <div className={clsx('h-1.5 rounded-full', c.bg)}>
        <div className={clsx('h-1.5 rounded-full transition-all', c.bar, c.width)} />
      </div>
    </div>
  )
}
