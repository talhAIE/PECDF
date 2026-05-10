import { useQuery } from '@tanstack/react-query'
import { fetchCurrencySensitivity } from '../api/analytics'

function getTargetMonth() {
  const today = new Date()
  const next  = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  return next.getFullYear() * 100 + (next.getMonth() + 1)
}

export function useCurrencySensitivity() {
  const targetMonth = getTargetMonth()
  return useQuery({
    queryKey: ['sensitivity', 'currency', targetMonth],
    queryFn:  () => fetchCurrencySensitivity({ target_yyyymm: targetMonth }),
    staleTime: 10 * 60 * 1000,
  })
}
