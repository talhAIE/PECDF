import { useMutation } from '@tanstack/react-query'
import { fetchSingleVariable } from '../api/scenario'

export function useSingleVariableScenario() {
  return useMutation({ mutationFn: fetchSingleVariable })
}
