import { create } from 'zustand'

export const useUIStore = create((set) => ({
  activeCommodity: '1006',
  setActiveCommodity: (hs) => set({ activeCommodity: hs })
}))
