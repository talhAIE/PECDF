import { useMemo } from 'react'
import { clsx } from 'clsx'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  DollarSign,
  Flame,
  Gauge,
  LayoutGrid,
  LineChart,
  MessageSquare,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useMomentum } from '../hooks/useMomentum'
import { usePortfolioForecast } from '../hooks/usePortfolioForecast'
import { useMacroStore } from '../store/macroStore'
import { useAuthStore } from '../store/authStore'
import CommodityCard from '../components/ui/CommodityCard'
import MomentumBadge from '../components/ui/MomentumBadge'
import PortfolioDonut from '../components/charts/PortfolioDonut'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import ErrorState from '../components/ui/ErrorState'
import PageHeader from '../components/ui/PageHeader'
import { welcomeFirstName } from '../utils/displayName'

function buildSparkData(item, forecastM) {
  const { last_actual_m, momentum_3m_pct = 0, momentum_6m_pct = 0 } = item
  const v6 = +(last_actual_m / (1 + momentum_6m_pct / 100)).toFixed(1)
  const v3 = +(last_actual_m / (1 + momentum_3m_pct / 100)).toFixed(1)
  const spark = [v6, v3, +last_actual_m.toFixed(1)]
  if (forecastM != null) spark.push(+forecastM.toFixed(1))
  return spark
}

function dirFromPct(pct) {
  if (pct > 0.05) return 'up'
  if (pct < -0.05) return 'down'
  return 'flat'
}

/** Short greeting from login payload (typically email-only). */
function welcomeLabel(user) {
  if (!user?.email) return null
  const local = user.email.split('@')[0] || ''
  const token = local.replace(/[._+-]+/g, ' ').trim().split(/\s+/)[0]
  if (!token) return null
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
}

/** Page section — muted rail keeps long pages scannable without loud cards everywhere */
function PageBlock({ eyebrow, title, description, right, children, className = '' }) {
  return (
    <section className={clsx('border-l border-slate-200/90 pl-5 sm:pl-6', className)}>
      {(eyebrow || title || description || right) && (
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {eyebrow && (
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[1.35rem]">
                {title}
              </h2>
            )}
            {description && (
              <p className="max-w-2xl pt-1 text-[0.9375rem] leading-snug text-slate-600">{description}</p>
            )}
          </div>
          {right && <div className="shrink-0 sm:pt-0.5">{right}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

function MacroKpiTile({ icon: Icon, label, value, sub, accent = 'indigo' }) {
  const bar = {
    indigo: 'border-l-indigo-500',
    amber: 'border-l-amber-500',
    violet: 'border-l-violet-500',
  }
  const iconBg = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  }
  const b = bar[accent] ?? bar.indigo
  const ib = iconBg[accent] ?? iconBg.indigo

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-slate-200/90 border-l-[3px] bg-white p-5 shadow-sm ${b}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${ib}`}
        >
          <Icon size={18} strokeWidth={2} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      </div>
      <p className="tabular-fig font-mono text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-2 text-[13px] leading-snug text-slate-600">{sub}</p>}
    </div>
  )
}

function MacroContextGrid({ usd_pkr, brent_oil, us_confidence }) {
  const tiles = [
    {
      icon: DollarSign,
      label: 'USD / PKR',
      value: usd_pkr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sub: 'Applied across all modeled values.',
      accent: 'indigo',
    },
    {
      icon: Flame,
      label: 'Brent crude',
      value: `$${brent_oil.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Per barrel — same as toolbar.',
      accent: 'amber',
    },
    {
      icon: Gauge,
      label: 'US confidence',
      value: us_confidence.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      sub: 'Conference Board composite.',
      accent: 'violet',
    },
  ]
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      {tiles.map((t) => (
        <MacroKpiTile key={t.label} {...t} />
      ))}
    </div>
  )
}

function SignalRow({ item, forecastMap }) {
  const navigate = useNavigate()
  const fc = forecastMap[item.hs_code]
  const pct = item.momentum_3m_pct ?? 0

  return (
    <div
      role="button"
      tabIndex={0}
      className="grid cursor-pointer grid-cols-1 items-center gap-2 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50/80 sm:grid-cols-[minmax(0,1fr)_5.5rem_6.5rem]"
      onClick={() => navigate(`/commodity/${item.hs_code}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/commodity/${item.hs_code}`)
        }
      }}
    >
      <div className="min-w-0 border-b border-slate-100 pb-2 sm:border-0 sm:pb-0">
        <p className="truncate text-sm font-medium text-slate-800">{item.commodity}</p>
        <p className="font-mono text-xs text-slate-500">HS {item.hs_code}</p>
      </div>
      <div className="flex justify-between gap-3 sm:block sm:text-right">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">Next month</span>
        <span
          className="font-mono text-sm font-semibold tabular-nums text-slate-800"
          title="Next-month forecast ($M)"
        >
          {fc ? `$${fc.predicted_m.toFixed(1)}M` : '—'}
        </span>
      </div>
      <div className="flex justify-end sm:justify-end">
        <MomentumBadge direction={dirFromPct(pct)} value={Math.abs(item.momentum_3m_pct)} size="sm" />
      </div>
    </div>
  )
}

function SignalsTableHeader() {
  return (
    <div className="mb-1 hidden grid-cols-[minmax(0,1fr)_5.5rem_6.5rem] gap-2 border-b border-slate-200 px-3 pb-2 sm:grid">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Commodity</span>
      <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Next mo.</span>
      <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">3M Δ</span>
    </div>
  )
}

function SignalPanel({ variant, title, subtitle, children, empty }) {
  const isEmerald = variant === 'emerald'
  const stripe = isEmerald ? 'border-l-emerald-500' : 'border-l-rose-500'
  const iconWrap = isEmerald
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : 'bg-rose-50 text-rose-700 ring-rose-100'
  const HeaderIcon = isEmerald ? TrendingUp : TrendingDown

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ${stripe} border-l-[3px]`}
    >
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${iconWrap}`}
          >
            <HeaderIcon size={18} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-2 pb-4 pt-2 sm:px-4">
        {empty ? (
          <p className="mx-1 mt-1 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm leading-relaxed text-slate-600">
            {empty}
          </p>
        ) : (
          <>
            <SignalsTableHeader />
            <div className="divide-y divide-slate-100">{children}</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()
  const user = useAuthStore((s) => s.user)
  const greeting = welcomeFirstName(user)

  const {
    data: momentumData,
    isLoading: momLoading,
    isError: momError,
    error: momErrorDetail,
    refetch: momRefetch,
  } = useMomentum()

  const {
    data: portfolioData,
    isLoading: pfLoading,
    isFetching: pfFetching,
    isError: pfError,
    error: pfErrorDetail,
    refetch: pfRefetch,
  } = usePortfolioForecast()

  const forecastMap = useMemo(() => {
    const map = {}
    portfolioData?.commodities?.forEach((c) => { map[c.hs_code] = c })
    return map
  }, [portfolioData])

  const commodityCards = useMemo(() => {
    if (!momentumData?.commodities) return []
    return momentumData.commodities.map((m) => ({
      hs_code: m.hs_code,
      name: m.commodity,
      lastActual_m: m.last_actual_m,
      nextForecast_m: forecastMap[m.hs_code]?.predicted_m ?? null,
      momentum: m,
      sparkData: buildSparkData(m, forecastMap[m.hs_code]?.predicted_m),
    }))
  }, [momentumData, forecastMap])

  const { opportunities, watchlist } = useMemo(() => {
    if (!momentumData?.commodities) return { opportunities: [], watchlist: [] }
    const list = momentumData.commodities
    const winners = list
      .filter((c) => c.momentum_3m_pct > 0)
      .sort((a, b) => b.momentum_3m_pct - a.momentum_3m_pct)
      .slice(0, 3)
    const losers = list
      .filter((c) => c.momentum_3m_pct < 0)
      .sort((a, b) => a.momentum_3m_pct - b.momentum_3m_pct)
      .slice(0, 3)
    return { opportunities: winners, watchlist: losers }
  }, [momentumData])

  const portfolioTotalRight =
    pfLoading ? (
      <div className="min-h-[7.75rem] rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-5">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200/80" />
        <div className="mt-6 h-9 w-[8.5rem] animate-pulse rounded-md bg-slate-200/80" />
      </div>
    ) : portfolioData && !pfError ? (
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50 px-6 py-5 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.15)] ring-1 ring-slate-100/90">
        <p className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Modeled portfolio
        </p>
        <p className="mt-4 text-sm font-medium text-slate-600">Next‑month horizon</p>
        <p className="tabular-fig mt-0.5 font-mono text-[2.125rem] font-semibold leading-none tracking-tight text-slate-950 sm:text-[2.375rem]">
          ${portfolioData.total_m.toFixed(1)}
          <span className="ml-1 text-xl font-semibold tracking-tight text-slate-500">M USD</span>
        </p>
        <div className="mt-5 border-t border-slate-100 pt-3">
          <p className="text-[11px] leading-snug text-slate-500">Roll‑up across the ten‑sector basket at your current PKR · oil · confidence settings.</p>
        </div>
      </div>
    ) : null

  const quickLinks = [
    { to: '/forecast', label: 'Forecasts', icon: LineChart },
    { to: '/scenario', label: 'Scenarios', icon: SlidersHorizontal },
    { to: '/analyst', label: 'AI analyst', icon: MessageSquare },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-16 lg:max-w-[1200px]">
      <PageHeader
        eyebrow="Home"
        title={greeting ? `${greeting}, welcome back.` : 'Your workspace'}
        description="Overview of modeled export demand: next‑month outlook, momentum sparks, and how the basket allocates — tied to whatever you set in the market bar."
        hint="Spot quote getting stale? Use Sync live in the toolbar once; every chart downstream picks up refreshed FX, Brent, and confidence."
        icon={LayoutGrid}
        right={portfolioTotalRight}
      />

      <nav
        className="rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_36px_-20px_rgba(15,23,42,0.1)]"
        aria-label="Quick navigation"
      >
        <p className="mb-3 px-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Shortcuts
        </p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map(({ to, label, icon: NavIcon }) => (
            <Link
              key={to}
              to={to}
              className="group inline-flex flex-1 min-w-[8.5rem] items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-[0.8125rem] font-medium text-slate-800 transition-colors hover:border-slate-900/15 hover:bg-slate-50 sm:flex-initial sm:min-w-0"
            >
              <span className="inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
                  <NavIcon size={16} strokeWidth={2} aria-hidden />
                </span>
                {label}
              </span>
              <ArrowRight
                size={15}
                className="text-slate-400 transition-colors group-hover:translate-x-0.5 group-hover:text-slate-900"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </nav>

      {/* Macro */}
      <PageBlock
        eyebrow="Drivers"
        title="Macro assumptions"
        description="Echo of the sticky market bar below — edits there flow through every modeled number on this page."
      >
        <MacroContextGrid usd_pkr={usd_pkr} brent_oil={brent_oil} us_confidence={us_confidence} />
      </PageBlock>

      {/* Portfolio */}
      <PageBlock
        eyebrow="Forecasts"
        title="Basket & allocation"
        description="Cards carry the modeled next‑month print plus a short trajectory strip; the chart on the right is share of aggregate basket value."
      >
        {momError && (
          <ErrorState
            error={momErrorDetail}
            fallback="Could not load momentum data from the server."
            onRetry={momRefetch}
          />
        )}

        {!momError && pfError && (
          <ErrorState
            error={pfErrorDetail}
            fallback="Could not load portfolio forecast. Check macro inputs are within toolbar limits."
            onRetry={pfRefetch}
            className="mb-6"
          />
        )}

        {!momError && (
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3 text-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
                  <LayoutGrid size={17} strokeWidth={2.1} />
                </span>
                <div>
                  <span className="font-display text-sm font-semibold text-slate-950">Tracked basket</span>
                  <p className="text-xs text-slate-500">Ten HS codes · USD millions · horizon T+1</p>
                </div>
              </div>
              {!momLoading && pfFetching && (
                <span className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 sm:self-auto">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-900" />
                  Updating forecasts…
                </span>
              )}
            </div>

            <div className="flex flex-col xl:flex-row">
              <div className="min-w-0 flex-1 p-5 sm:p-6 lg:p-7">
                {momLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {commodityCards.map((c) => (
                      <CommodityCard key={c.hs_code} {...c} />
                    ))}
                  </div>
                )}
              </div>

              <aside className="border-t border-slate-100 bg-slate-50/50 xl:w-[min(100%,320px)] xl:border-l xl:border-t-0">
                <div className="p-5 sm:p-6 lg:p-7">
                  <h3 className="font-display text-sm font-semibold text-slate-950">Portfolio mix</h3>
                  <p className="mt-1 text-xs leading-snug text-slate-600">Next‑month share — hover wedges for breakdown.</p>
                  <div className="mt-6">
                    {pfLoading ? (
                      <div className="space-y-4">
                        <div className="mx-auto h-44 w-44 animate-pulse rounded-full bg-slate-200/80" />
                        <div className="space-y-2">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-2.5 w-full animate-pulse rounded-full bg-slate-200/90" />
                          ))}
                        </div>
                      </div>
                    ) : pfError ? (
                      <ErrorState
                        error={pfErrorDetail}
                        fallback="Could not load forecast."
                        onRetry={pfRefetch}
                        className="py-8"
                      />
                    ) : (
                      <PortfolioDonut
                        data={portfolioData?.commodities ?? []}
                        totalM={portfolioData?.total_m ?? 0}
                      />
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </PageBlock>

      {/* Signals */}
      <PageBlock
        eyebrow="Momentum"
        title="Quarterly trajectory"
        description="Rolling 3‑month move in reported exports vs your scenario controls. Separate from toolbar stress tests."
      >
        {momLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : momError ? null : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-8">
            <SignalPanel
              variant="emerald"
              title="Leaders"
              subtitle="Strongest positive 3M export momentum vs prior pace."
              empty={
                opportunities.length === 0
                  ? 'No positive 3M momentum in the basket right now — scan the companion list or open a commodity for detail.'
                  : null
              }
            >
              {opportunities.length > 0 &&
                opportunities.map((item) => (
                  <SignalRow key={item.hs_code} item={item} forecastMap={forecastMap} />
                ))}
            </SignalPanel>

            <SignalPanel
              variant="rose"
              title="Soft spots"
              subtitle="Sharpest negative 3M moves — worth a second pass on drivers."
              empty={
                watchlist.length === 0
                  ? 'Nothing weakening on a 3M view — drift is fairly balanced.'
                  : null
              }
            >
              {watchlist.length > 0 &&
                watchlist.map((item) => (
                  <SignalRow key={item.hs_code} item={item} forecastMap={forecastMap} />
                ))}
            </SignalPanel>
          </div>
        )}
      </PageBlock>
    </div>
  )
}
