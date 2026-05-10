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
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import { TrendingUp, TrendingDown, LineChart } from 'lucide-react'
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
    <div className="pb-8">
      <PageHeader
        eyebrow="Forecasts"
        title="Forecast center"
        description="Multi-horizon export forecasts driven by the macro inputs in the toolbar. Pick a commodity and horizon—the chart merges history with modeled months ahead."
        hint="Uncertainty bands widen with horizon length. Toggle bands off for a simpler view when presenting."
        icon={LineChart}
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <aside className="w-full shrink-0 space-y-4 lg:w-72">
          {/* Commodity selector */}
          <SurfaceCard>
            <CommoditySelector value={hs} onChange={setHs} />
          </SurfaceCard>

          {/* Horizon selector */}
          <SurfaceCard>
            <HorizonSelector value={horizon} onChange={setHorizon} />
          </SurfaceCard>

          {/* Key metrics */}
          <SurfaceCard gradientTop>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Key metrics
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
          </SurfaceCard>

          {/* Commodity about */}
          {meta.about && (
            <SurfaceCard className="border-indigo-100/50 bg-gradient-to-br from-slate-50/80 to-indigo-50/20">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                About
              </p>
              <p className="text-xs leading-relaxed text-slate-600">{meta.about}</p>
              {mape != null && (
                <div className="mt-3 flex gap-3 text-xs text-slate-500">
                  <span>MAPE <span className="font-semibold text-slate-700">{mape}%</span></span>
                  <span>R² <span className="font-semibold text-slate-700">{meta.r2 ?? '—'}</span></span>
                </div>
              )}
            </SurfaceCard>
          )}
        </aside>

        {/* ── Right content ───────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Chart header with band toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">{commodityName}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
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
            <label className="flex cursor-pointer select-none items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <input
                type="checkbox"
                checked={showBands}
                onChange={(e) => setShowBands(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              <span className="text-xs font-medium text-slate-600">Confidence bands</span>
            </label>
          </div>

          {/* Chart */}
          {isError ? (
            <ErrorState
              message="Failed to load forecast data."
              onRetry={() => { histRefetch(); fcRefetch() }}
            />
          ) : isLoading ? (
            <SurfaceCard>
              <div className="h-96 animate-pulse rounded-xl bg-gradient-to-br from-slate-100 to-indigo-50/40" />
            </SurfaceCard>
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
