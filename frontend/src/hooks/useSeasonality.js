import { useQuery } from '@tanstack/react-query'
import { fetchSeasonality } from '../api/analytics'

export function useSeasonality(hs_code) {
  return useQuery({
    queryKey: ['seasonality', hs_code],
    queryFn:  () => fetchSeasonality(hs_code),
    staleTime: 60 * 60 * 1000,
    enabled:  !!hs_code,
  })
}
