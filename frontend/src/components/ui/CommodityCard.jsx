import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import MomentumBadge from './MomentumBadge'
import SparkLine from '../charts/SparkLine'

export default function CommodityCard({
  hs_code,
  name,
  lastActual_m,
  nextForecast_m,
  momentum,
  sparkData = [],
  className = '',
}) {
  const navigate = useNavigate()

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer',
        'hover:shadow-md transition-shadow flex flex-col',
        className
      )}
      onClick={() => navigate(`/commodity/${hs_code}`)}
    >
      {/* Top row: HS code + badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs text-slate-400">HS {hs_code}</span>
        {momentum && (
          <MomentumBadge
            direction={momentum.direction}
            value={Math.abs(momentum.momentum_3m_pct)}
            size="sm"
          />
        )}
      </div>

      {/* Commodity name */}
      <p className="font-semibold text-slate-800 text-sm mb-2 truncate">{name}</p>

      {/* Sparkline */}
      <div className="mb-2">
        <SparkLine data={sparkData} forecastCount={1} />
      </div>

      {/* Last actual / Forecast */}
      <div className="flex justify-between mt-auto text-xs">
        <div>
          <p className="text-slate-400">Last Actual</p>
          <p className="font-mono font-semibold text-slate-700">
            {lastActual_m != null ? `$${lastActual_m.toFixed(1)}M` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">Forecast</p>
          <p className="font-mono font-semibold text-red-600">
            {nextForecast_m != null ? `$${nextForecast_m.toFixed(1)}M` : '—'}
          </p>
        </div>
      </div>

      {/* View forecast link */}
      <button
        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium text-left"
        onClick={(e) => { e.stopPropagation(); navigate(`/forecast?hs=${hs_code}`) }}
      >
        View Forecast →
      </button>
    </div>
  )
}
