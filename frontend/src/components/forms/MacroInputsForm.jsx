import { clsx } from 'clsx'

const FIELDS = [
  { key: 'usd_pkr',       label: 'USD/PKR',         unit: 'Rate',      min: 200, max: 500, step: 0.5 },
  { key: 'brent_oil',     label: 'Brent Oil',        unit: '$/barrel',  min: 20,  max: 200, step: 0.5 },
  { key: 'us_confidence', label: 'US Confidence',    unit: 'Index',     min: 50,  max: 150, step: 0.5 },
]

export default function MacroInputsForm({ values, onChange, label = 'Macro Assumptions', className = '' }) {
  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-medium text-slate-600 mb-2">{label}</p>
      )}
      <div className="space-y-2">
        {FIELDS.map(({ key, label: fieldLabel, unit, min, max, step }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div className="shrink-0">
              <p className="text-xs font-medium text-slate-700 leading-none">{fieldLabel}</p>
              <p className="text-xs text-slate-400 leading-none mt-0.5">{unit}</p>
            </div>
            <input
              type="number"
              value={values[key]}
              min={min}
              max={max}
              step={step}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) onChange(key, v)
              }}
              className={clsx(
                'w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm font-mono text-slate-900 bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
