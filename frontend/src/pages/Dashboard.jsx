import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMomentum } from '../hooks/useMomentum'
import { usePortfolioForecast } from '../hooks/usePortfolioForecast'
import { useMacroStore } from '../store/macroStore'
import MetricCard from '../components/ui/MetricCard'
import CommodityCard from '../components/ui/CommodityCard'
import MomentumBadge from '../components/ui/MomentumBadge'
import PortfolioDonut from '../components/charts/PortfolioDonut'
import { SkeletonCard, SkeletonChart } from '../components/ui/SkeletonLoader'
import ErrorState from '../components/ui/ErrorState'

// Reconstruct a 4-point sparkline from momentum percentages (no extra API calls)
function buildSparkData(item, forecastM) {
  const { last_actual_m, momentum_3m_pct = 0, momentum_6m_pct = 0 } = item
  const v6 = +(last_actual_m / (1 + momentum_6m_pct / 100)).toFixed(1)
  const v3 = +(last_actual_m / (1 + momentum_3m_pct / 100)).toFixed(1)
  const spark = [v6, v3, +last_actual_m.toFixed(1)]
  if (forecastM != null) spark.push(+forecastM.toFixed(1))
  return spark
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}

function SignalRow({ item, forecastMap }) {
  const navigate = useNavigate()
  const fc = forecastMap[item.hs_code]

  return (
    <div
      className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
      onClick={() => navigate(`/commodity/${item.hs_code}`)}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.commodity}</p>
        <p className="font-mono text-xs text-slate-400">HS {item.hs_code}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {fc && (
          <span className="text-xs font-mono text-slate-500">
            ${fc.predicted_m.toFixed(1)}M
          </span>
        )}
        <MomentumBadge
          direction={item.direction}
          value={Math.abs(item.momentum_3m_pct)}
          size="sm"
        />
      </div>
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()

  const {
    data: momentumData,
    isLoading: momLoading,
    isError: momError,
    refetch: momRefetch,
  } = useMomentum()

  const {
    data: portfolioData,
    isLoading: pfLoading,
    isError: pfError,
    refetch: pfRefetch,
  } = usePortfolioForecast()

  // hs_code → forecast item for O(1) lookup
  const forecastMap = useMemo(() => {
    const map = {}
    portfolioData?.commodities?.forEach((c) => { map[c.hs_code] = c })
    return map
  }, [portfolioData])

  // Merge momentum + forecast into card props
  const commodityCards = useMemo(() => {
    if (!momentumData?.commodities) return []
    return momentumData.commodities.map((m) => ({
      hs_code:       m.hs_code,
      name:          m.commodity,
      lastActual_m:  m.last_actual_m,
      nextForecast_m: forecastMap[m.hs_code]?.predicted_m ?? null,
      momentum:      m,
      sparkData:     buildSparkData(m, forecastMap[m.hs_code]?.predicted_m),
    }))
  }, [momentumData, forecastMap])

  // Top 3 up / bottom 3 by 3-month momentum
  const { opportunities, watchlist } = useMemo(() => {
    if (!momentumData?.commodities) return { opportunities: [], watchlist: [] }
    const sorted = [...momentumData.commodities].sort(
      (a, b) => b.momentum_3m_pct - a.momentum_3m_pct
    )
    return {
      opportunities: sorted.slice(0, 3),
      watchlist:     sorted.slice(-3).reverse(),
    }
  }, [momentumData])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Export Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pakistan export portfolio — next-month forecast under current macro conditions
        </p>
      </div>

      {/* 1. Market Pulse ─────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Market Inputs</SectionHeading>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="USD / PKR"
            value={usd_pkr.toFixed(1)}
            unit="PKR"
            sublabel="Adjust in the bar above"
          />
          <MetricCard
            label="Brent Crude"
            value={`$${brent_oil.toFixed(1)}`}
            unit="/ bbl"
            sublabel="Adjust in the bar above"
          />
          <MetricCard
            label="US Consumer Confidence"
            value={us_confidence.toFixed(1)}
            sublabel="Conference Board Index"
          />
        </div>
      </section>

      {/* 2. Portfolio Grid + Donut ────────────────────────────────────────────── */}
      <section>
        <SectionHeading>
          Portfolio Forecast
          {portfolioData && (
            <span className="ml-2 normal-case text-slate-500 font-normal">
              — Total ${portfolioData.total_m.toFixed(1)}M
            </span>
          )}
        </SectionHeading>

        {momError && (
          <ErrorState
            message="Could not load momentum data from the server."
            onRetry={momRefetch}
          />
        )}

        {!momError && (
          <div className="flex gap-6">
            {/* 10-commodity grid */}
            <div className="flex-1 min-w-0">
              {momLoading ? (
                <div className="grid grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-4">
                  {commodityCards.map((c) => (
                    <CommodityCard key={c.hs_code} {...c} />
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio donut */}
            <div className="w-64 shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Portfolio Mix</h3>
                {pfLoading ? (
                  <div className="space-y-3">
                    <div className="h-40 animate-pulse bg-slate-100 rounded-full mx-auto w-40" />
                    <div className="space-y-2 mt-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-3 animate-pulse bg-slate-200 rounded w-full" />
                      ))}
                    </div>
                  </div>
                ) : pfError ? (
                  <ErrorState
                    message="Could not load forecast."
                    onRetry={pfRefetch}
                    className="py-6"
                  />
                ) : (
                  <PortfolioDonut
                    data={portfolioData?.commodities ?? []}
                    totalM={portfolioData?.total_m ?? 0}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Signals: Opportunities & Watch List ─────────────────────────────── */}
      <section>
        <SectionHeading>Signals — 3-Month Momentum</SectionHeading>

        {momLoading ? (
          <div className="grid grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : momError ? null : (
          <div className="grid grid-cols-2 gap-6">
            {/* Opportunities */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Opportunities
              </h3>
              <div className="space-y-0">
                {opportunities.map((item) => (
                  <SignalRow key={item.hs_code} item={item} forecastMap={forecastMap} />
                ))}
              </div>
            </div>

            {/* Watch List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Watch List
              </h3>
              <div className="space-y-0">
                {watchlist.map((item) => (
                  <SignalRow key={item.hs_code} item={item} forecastMap={forecastMap} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
