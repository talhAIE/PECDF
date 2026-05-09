import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULTS = {
  usd_pkr: 285.0,
  brent_oil: 78.5,
  us_confidence: 98.0
}

export const useMacroStore = create(
  persist(
    (set) => ({
      ...DEFAULTS,

      setMacro: (field, value) => set((state) => ({ ...state, [field]: value })),

      resetMacro: () => set(DEFAULTS)
    }),
    { name: 'pecdf-macro' }
  )
)
