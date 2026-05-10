import { useQuery } from '@tanstack/react-query'
import { fetchMomentum } from '../api/analytics'

export function useMomentum() {
  return useQuery({
    queryKey: ['momentum'],
    queryFn: fetchMomentum,
    staleTime: 5 * 60 * 1000,
  })
}
