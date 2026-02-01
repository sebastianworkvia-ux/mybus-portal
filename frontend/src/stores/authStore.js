import { create } from 'zustand'
import { authService } from '../services/services'
import { clearSession } from '../utils/analytics'

// Helper functions for localStorage
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await authService.register(data)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      set({
        user: response.data.user,
        token: response.data.token,
        loading: false
      })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Rejestracja nie powiodła się',
        loading: false
      })
      throw error
    }
  },

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const response = await authService.login(credentials)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      set({
        user: response.data.user,
        token: response.data.token,
        loading: false
      })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Logowanie nie powiodło się',
        loading: false
      })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearSession() // Clear analytics session on logout
    set({ user: null, token: null })
  },

  setError: (error) => set({ error })
}))
