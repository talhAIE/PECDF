import { useMutation } from '@tanstack/react-query'
import { fetchMultiVariable } from '../api/scenario'

export function useMultiVariableScenario() {
  return useMutation({ mutationFn: fetchMultiVariable })
}
