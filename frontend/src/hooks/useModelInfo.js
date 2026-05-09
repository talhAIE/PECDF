import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from '../api/system'
import { fetchCommodities } from '../api/forecast'

export function useModelInfo() {
  return useQuery({
    queryKey: ['model-info'],
    queryFn: fetchHealth,
    staleTime: 60 * 1000,
    retry: 1,
  })
}

// Returns { [hs_code]: mape } map from backend
export function useCommodityMapes() {
  return useQuery({
    queryKey: ['commodity-mapes'],
    queryFn: fetchCommodities,
    staleTime: 60 * 1000,
    retry: 1,
    select: (data) =>
      Object.fromEntries((data ?? []).map((c) => [c.hs_code, c.test_mape])),
  })
}

// 202312 → 202401
export function nextMonth(yyyymm) {
  if (!yyyymm) return null
  const y = Math.floor(yyyymm / 100)
  const m = yyyymm % 100
  return m === 12 ? (y + 1) * 100 + 1 : y * 100 + (m + 1)
}

// 202312 → "Dec 2023"
export function fmtMonthYear(yyyymm) {
  if (!yyyymm) return '—'
  const y = Math.floor(yyyymm / 100)
  const m = yyyymm % 100
  return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}
