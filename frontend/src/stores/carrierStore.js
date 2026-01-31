import { create } from 'zustand'
import { carrierService } from '../services/services'

export const useCarrierStore = create((set) => ({
  carriers: [],
  currentCarrier: null,
  loading: false,
  error: null,
  filters: {
    country: '',
    service: '',
    search: ''
  },

  getCarriers: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await carrierService.getCarriers(params)
      // Zabezpieczenie: upewnij się, że otrzymaliśmy tablicę
      const data = Array.isArray(response.data) ? response.data : []
      if (!Array.isArray(response.data)) {
        console.error('Otrzymano nieprawidłowy format danych z serwera:', response.data)
      }
      
      set({ carriers: data, loading: false })
      return data
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch carriers'
      console.error('Błąd pobierania przewoźników:', errorMsg, error)
      set({
        error: errorMsg,
        loading: false
      })
    }
  },

  getCarrierById: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await carrierService.getCarrierById(id)
      set({ currentCarrier: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to fetch carrier',
        loading: false
      })
    }
  },

  createCarrier: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await carrierService.createCarrier(data)
      set({ currentCarrier: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to create carrier',
        loading: false
      })
      throw error
    }
  },

  updateCarrier: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await carrierService.updateCarrier(data)
      set({ currentCarrier: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to update carrier',
        loading: false
      })
      throw error
    }
  },

  deleteCarrier: async () => {
    set({ loading: true, error: null })
    try {
      await carrierService.deleteCarrier()
      set({ currentCarrier: null, loading: false })
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to delete carrier',
        loading: false
      })
      throw error
    }
  },

  setFilters: (filters) => set({ filters }),
  setError: (error) => set({ error })
}))
