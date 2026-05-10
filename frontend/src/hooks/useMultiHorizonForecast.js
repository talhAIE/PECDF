import { useQuery } from '@tanstack/react-query'
import { fetchMultiHorizon } from '../api/forecast'
import { useMacroStore } from '../store/macroStore'
import { useModelInfo } from './useModelInfo'

// ── Date arithmetic helpers ───────────────────────────────────────────────────

export function currentYYYYMM() {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

export function addMonths(yyyymm, n) {
  let y = Math.floor(yyyymm / 100)
  let m = yyyymm % 100 + n
  while (m > 12) { m -= 12; y += 1 }
  while (m < 1)  { m += 12; y -= 1 }
  return y * 100 + m
}

// Months from `from` (exclusive) to `to` (inclusive)
// e.g. from=202512, to=202605 → 5 (Jan, Feb, Mar, Apr, May 2026)
export function monthsBetween(from, to) {
  const fy = Math.floor(from / 100), fm = from % 100
  const ty = Math.floor(to / 100),   tm = to % 100
  return Math.max(0, (ty - fy) * 12 + (tm - fm))
}

/**
 * Compute the forecast window given the dataset end and user's forward horizon.
 *
 * Always starts from the first month after the dataset ends and always includes
 * every month through the current month, then adds the requested forward horizon.
 *
 * Example:  dataEnd=202512, today=202605, horizon=3
 *   startMonth  = 202601           (Jan 2026)
 *   gapMonths   = 5                (Jan–May 2026, the months since data ended)
 *   totalMonths = 5 + 3 = 8        (Jan 2026 – Aug 2026)
 *   endMonth    = 202608           (Aug 2026)
 */
export function computeForecastWindow(dataEnd, horizon) {
  const current     = currentYYYYMM()
  const startMonth  = addMonths(dataEnd, 1)
  const gapMonths   = monthsBetween(dataEnd, current)
  const totalMonths = Math.max(gapMonths + Math.max(horizon, 1), 1)
  const endMonth    = addMonths(startMonth, totalMonths - 1)
  return { startMonth, totalMonths, gapMonths, endMonth }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMultiHorizonForecast(hs_code, horizon) {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()
  const { data: modelInfo } = useModelInfo()

  const dataEnd = modelInfo?.data_end

  // Compute the real window once dataEnd is known; fall back to simple next-month
  // so the query can fire immediately without waiting for model-info.
  const { startMonth, totalMonths } = dataEnd
    ? computeForecastWindow(dataEnd, horizon)
    : { startMonth: addMonths(currentYYYYMM(), 1), totalMonths: Math.max(horizon, 1) }

  return useQuery({
    queryKey: [
      'forecast', 'multi',
      hs_code, horizon, startMonth, totalMonths,
      usd_pkr, brent_oil, us_confidence,
    ],
    queryFn: () => fetchMultiHorizon({
      hs_code,
      start_yyyymm: startMonth,
      n_months:     totalMonths,
      macro: { usd_pkr, brent_oil, us_confidence },
    }),
    staleTime: 2 * 60 * 1000,
    enabled:  !!hs_code && horizon > 0,
  })
}
