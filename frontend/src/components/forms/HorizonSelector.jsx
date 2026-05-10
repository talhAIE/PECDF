import { clsx } from 'clsx'

const TICKS = [1, 3, 6, 12]

export default function HorizonSelector({ value, onChange, label = 'Forecast Horizon', className = '' }) {
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-slate-600">{label}</label>
          <span className="text-xs font-semibold text-blue-600 font-mono">
            {value} {value === 1 ? 'month' : 'months'}
          </span>
        </div>
      )}

      <input
        type="range"
        min={1}
        max={12}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={clsx(
          'w-full h-1.5 rounded-full appearance-none cursor-pointer',
          'bg-slate-200 accent-blue-600'
        )}
      />

      {/* Tick marks */}
      <div className="flex justify-between mt-1">
        {TICKS.map((t) => (
          <span
            key={t}
            onClick={() => onChange(t)}
            className={clsx(
              'text-xs cursor-pointer transition-colors',
              value === t ? 'text-blue-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {t}m
          </span>
        ))}
      </div>
    </div>
  )
}
