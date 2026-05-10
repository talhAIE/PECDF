import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { TrendingDown, TrendingUp } from 'lucide-react'
import MomentumBadge from './MomentumBadge'
import SparkLine from '../charts/SparkLine'

function forecastTone(last, next) {
  if (last == null || next == null) return 'muted'
  if (next > last + 0.05) return 'up'
  if (next < last - 0.05) return 'down'
  return 'flat'
}

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
  const tone = forecastTone(lastActual_m, nextForecast_m)
  const forecastClass =
    tone === 'up'
      ? 'text-emerald-700'
      : tone === 'down'
        ? 'text-rose-600'
        : 'text-slate-700'

  return (
    <div
      className={clsx(
        'group relative flex min-h-[172px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-3',
        'shadow-[0_4px_20px_-8px_rgba(15,23,42,0.1)] transition-all duration-300',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:scale-x-0 before:bg-gradient-to-r before:from-indigo-500 before:to-violet-500 before:transition-transform before:duration-300 group-hover:before:scale-x-100',
        'hover:-translate-y-1 hover:border-indigo-200/90 hover:shadow-[0_16px_40px_-20px_rgba(79,70,229,0.25)] sm:p-4',
        className
      )}
      onClick={() => navigate(`/commodity/${hs_code}`)}
    >
      {/* Top row: HS code + badge */}
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] text-slate-400 sm:text-xs">HS {hs_code}</span>
        {momentum && (
          <MomentumBadge
            direction={momentum.direction}
            value={Math.abs(momentum.momentum_3m_pct)}
            size="sm"
          />
        )}
      </div>

      <p className="mb-2 truncate text-sm font-semibold leading-snug text-slate-800 sm:text-[15px]">
        {name}
      </p>

      <div className="mb-2 min-h-[2.75rem]">
        <SparkLine
          data={sparkData}
          forecastCount={1}
          forecastUp={tone === 'up'}
          forecastDown={tone === 'down'}
        />
      </div>

      <div className="mt-auto flex justify-between gap-2 text-[11px] sm:text-xs">
        <div>
          <p className="text-slate-400">Last actual</p>
          <p className="font-mono font-semibold tabular-nums text-slate-700">
            {lastActual_m != null ? `$${lastActual_m.toFixed(1)}M` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-0.5 text-slate-400">
            Forecast
            {tone === 'up' && <TrendingUp className="text-emerald-500" size={12} aria-hidden />}
            {tone === 'down' && <TrendingDown className="text-rose-500" size={12} aria-hidden />}
          </p>
          <p className={clsx('font-mono font-semibold tabular-nums', forecastClass)}>
            {nextForecast_m != null ? `$${nextForecast_m.toFixed(1)}M` : '—'}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="mt-2 w-full rounded-md py-1 text-left text-xs font-medium text-blue-600 opacity-90 transition-opacity hover:text-blue-700 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/forecast?hs=${hs_code}`)
        }}
      >
        View forecast →
      </button>
    </div>
  )
}
