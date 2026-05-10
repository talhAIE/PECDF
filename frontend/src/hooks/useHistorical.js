import { useQuery } from '@tanstack/react-query'
import { fetchHistorical } from '../api/analytics'

export function useHistorical(hs_code, months = 24) {
  return useQuery({
    queryKey: ['historical', hs_code, months],
    queryFn:  () => fetchHistorical(hs_code, months),
    staleTime: 10 * 60 * 1000,
    enabled:  !!hs_code,
  })
}
