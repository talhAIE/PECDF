import { useQuery } from '@tanstack/react-query'
import { fetchAllCommodities } from '../api/forecast'
import { useMacroStore } from '../store/macroStore'
import { currentYYYYMM } from './useMultiHorizonForecast'

export function usePortfolioForecast() {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()
  const targetMonth = currentYYYYMM()   // current month — no actuals exist post-dataset

  return useQuery({
    queryKey: ['forecast', 'all', targetMonth, usd_pkr, brent_oil, us_confidence],
    queryFn:  () => fetchAllCommodities({
      target_yyyymm: targetMonth,
      macro: { usd_pkr, brent_oil, us_confidence },
    }),
    staleTime: 2 * 60 * 1000,
  })
}
