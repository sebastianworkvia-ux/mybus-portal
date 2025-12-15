import { create } from 'zustand'
import { authService } from '../services/services'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await authService.register(data)
      localStorage.setItem('token', response.data.token)
      set({
        user: response.data.user,
        token: response.data.token,
        loading: false
      })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Registration failed',
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
      set({
        user: response.data.user,
        token: response.data.token,
        loading: false
      })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Login failed',
        loading: false
      })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  setError: (error) => set({ error })
}))
