import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useHistorical } from '../hooks/useHistorical'
import { useMultiHorizonForecast, computeForecastWindow, addMonths } from '../hooks/useMultiHorizonForecast'
import { useCommodityMapes, useModelInfo } from '../hooks/useModelInfo'
import { COMMODITY_META } from '../config/commodities'
import ForecastChart from '../components/charts/ForecastChart'
import CommoditySelector from '../components/forms/CommoditySelector'
import HorizonSelector from '../components/forms/HorizonSelector'
import ConfidenceBar from '../components/ui/ConfidenceBar'
import DataTable from '../components/ui/DataTable'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import ErrorState from '../components/ui/ErrorState'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { clsx } from 'clsx'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMonth(yyyymm) {
  const y = Math.floor(yyyymm / 100)
  const m = yyyymm % 100
  return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

const TABLE_COLUMNS = [
  {
    key:    'month_label',
    label:  'Month',
    sortable: false,
  },
  {
    key:    'predicted_m',
    label:  'Forecast',
    align:  'right',
    format: (v) => v != null ? `$${v.toFixed(2)}M` : '—',
  },
  {
    key:    'lower_bound',
    label:  'Lower',
    align:  'right',
    format: (v) => v != null ? `$${v.toFixed(2)}M` : '—',
  },
  {
    key:    'upper_bound',
    label:  'Upper',
    align:  'right',
    format: (v) => v != null ? `$${v.toFixed(2)}M` : '—',
  },
  {
    key:    'range_width',
    label:  'Uncertainty',
    align:  'right',
    format: (v) => v != null ? `±$${(v / 2).toFixed(2)}M` : '—',
  },
]

// ── Key metric row ────────────────────────────────────────────────────────────

function KpiRow({ label, value, trend }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : ''

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={clsx('text-sm font-semibold font-mono flex items-center gap-1', trendColor || 'text-slate-900')}>
        {TrendIcon && <TrendIcon size={12} />}
        {value}
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ForecastCenter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [hs,         setHs]         = useState(searchParams.get('hs') || '1006')
  const [horizon,    setHorizon]    = useState(Number(searchParams.get('n')) || 3)
  const [showBands,  setShowBands]  = useState(true)

  // Keep URL in sync with selections
  useEffect(() => {
    setSearchParams({ hs, n: String(horizon) }, { replace: true })
  }, [hs, horizon])

  const meta = COMMODITY_META[hs] ?? {}
  const { data: commodityMapes } = useCommodityMapes()
  const { data: modelInfo } = useModelInfo()
  const mape = commodityMapes?.[hs] ?? meta.mape

  // Compute the actual forecast window so we can show accurate labels
  const dataEnd = modelInfo?.data_end
  const { startMonth, totalMonths, gapMonths, endMonth } = dataEnd
    ? computeForecastWindow(dataEnd, horizon)
    : { startMonth: 0, totalMonths: horizon, gapMonths: 0, endMonth: 0 }

  const fmtMonthFull = (yyyymm) => {
    if (!yyyymm) return '—'
    const y = Math.floor(yyyymm / 100), m = yyyymm % 100
    return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
  }

  const {
    data: histResp,
    isLoading: histLoading,
    isError:   histError,
    refetch:   histRefetch,
  } = useHistorical(hs, 24)

  const {
    data: fcResp,
    isLoading: fcLoading,
    isError:   fcError,
    refetch:   fcRefetch,
  } = useMultiHorizonForecast(hs, horizon)

  // ── Derived values ──────────────────────────────────────────────────────────

  const historicalData = histResp?.data ?? []
  const forecastPoints = fcResp?.forecast ?? []

  const totalForecast = fcResp?.total_predicted_m ?? null

  // Compare forecasted total vs the same number of prior historical months
  const vsPriorPct = useMemo(() => {
    if (!totalForecast || historicalData.length < totalMonths) return null
    const lastN    = historicalData.slice(-totalMonths)
    const sumPrior = lastN.reduce((s, d) => s + (d.export_value_m ?? 0), 0)
    if (sumPrior === 0) return null
    return ((totalForecast - sumPrior) / sumPrior) * 100
  }, [totalForecast, historicalData, totalMonths])

  // Table rows with pre-computed fields
  const tableData = useMemo(() =>
    forecastPoints.map((p) => ({
      ...p,
      month_label: fmtMonth(p.month),
      range_width: p.upper_bound - p.lower_bound,
    })),
    [forecastPoints]
  )

  const commodityName = fcResp?.commodity ?? meta.name ?? `HS ${hs}`
  const isLoading     = histLoading || fcLoading
  const isError       = histError || fcError

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Forecast Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          Multi-horizon export forecasts driven by current macro conditions
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 space-y-4">
          {/* Commodity selector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <CommoditySelector value={hs} onChange={setHs} />
          </div>

          {/* Horizon selector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <HorizonSelector value={horizon} onChange={setHorizon} />
          </div>

          {/* Key metrics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Key Metrics
            </h3>

            {fcLoading ? (
              <SkeletonLoader lines={4} />
            ) : fcError ? (
              <p className="text-xs text-slate-400">Unable to load</p>
            ) : totalForecast != null ? (
              <div className="space-y-0">
                <KpiRow
                  label={`Total (${totalMonths}m)`}
                  value={`$${totalForecast.toFixed(1)}M`}
                />
                <KpiRow
                  label="Avg / month"
                  value={`$${(totalForecast / totalMonths).toFixed(1)}M`}
                />
                {vsPriorPct != null && (
                  <KpiRow
                    label="vs Prior Period"
                    value={`${vsPriorPct >= 0 ? '+' : ''}${vsPriorPct.toFixed(1)}%`}
                    trend={vsPriorPct >= 0 ? 'up' : 'down'}
                  />
                )}
                <div className="pt-3">
                  <ConfidenceBar mape={mape} horizon={horizon} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No forecast data</p>
            )}
          </div>

          {/* Commodity about */}
          {meta.about && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                About
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{meta.about}</p>
              {mape != null && (
                <div className="flex gap-3 mt-3 text-xs text-slate-500">
                  <span>MAPE <span className="font-semibold text-slate-700">{mape}%</span></span>
                  <span>R² <span className="font-semibold text-slate-700">{meta.r2 ?? '—'}</span></span>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── Right content ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Chart header with band toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{commodityName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {startMonth
                  ? `${fmtMonthFull(startMonth)} – ${fmtMonthFull(endMonth)}`
                  : `${horizon}-month forecast`
                }
                {gapMonths > 0 && (
                  <span className="ml-2 text-amber-500 font-medium">
                    · {gapMonths} gap month{gapMonths > 1 ? 's' : ''} + {horizon} ahead
                  </span>
                )}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBands}
                onChange={(e) => setShowBands(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
              <span className="text-xs text-slate-500">Confidence bands</span>
            </label>
          </div>

          {/* Chart */}
          {isError ? (
            <ErrorState
              message="Failed to load forecast data."
              onRetry={() => { histRefetch(); fcRefetch() }}
            />
          ) : isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="h-96 animate-pulse bg-slate-100 rounded-lg" />
            </div>
          ) : (
            <ForecastChart
              historicalData={historicalData}
              forecastData={forecastPoints}
              commodityName={commodityName}
              mape={mape}
              showBands={showBands}
            />
          )}

          {/* Data table */}
          {!isError && (
            <DataTable
              columns={TABLE_COLUMNS}
              data={tableData}
              downloadFilename={`forecast_${hs}_${horizon}m.csv`}
            />
          )}
        </div>
      </div>
    </div>
  )
}
