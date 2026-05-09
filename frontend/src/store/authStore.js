import { create } from 'zustand'

const stored = localStorage.getItem('pecdf_user')

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('pecdf_token') || null,
  user: stored ? JSON.parse(stored) : null,

  setAuth: (token, user) => {
    localStorage.setItem('pecdf_token', token)
    localStorage.setItem('pecdf_user', JSON.stringify(user))
    set({ token, user })
  },

  clearAuth: () => {
    localStorage.removeItem('pecdf_token')
    localStorage.removeItem('pecdf_user')
    set({ token: null, user: null })
  }
}))
