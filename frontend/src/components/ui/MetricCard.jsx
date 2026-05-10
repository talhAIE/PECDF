import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

export default function MetricCard({
  label,
  value,
  unit = '',
  sublabel = '',
  trend = null,      // 'up' | 'down' | 'flat'
  trendValue = '',   // e.g. "+2.3%"
  className = ''
}) {
  const trendConfig = {
    up:   { icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50'  },
    down: { icon: TrendingDown, color: 'text-red-600',   bg: 'bg-red-50'    },
    flat: { icon: Minus,        color: 'text-slate-400', bg: 'bg-slate-100' },
  }

  const t = trend ? trendConfig[trend] : null

  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm p-5', className)}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>

      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl font-bold text-slate-900 font-mono">{value}</span>
          {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
        </div>

        {t && (
          <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', t.bg, t.color)}>
            <t.icon size={12} />
            {trendValue}
          </div>
        )}
      </div>

      {sublabel && <p className="text-xs text-slate-400 mt-2">{sublabel}</p>}
    </div>
  )
}
