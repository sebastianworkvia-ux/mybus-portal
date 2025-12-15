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
      set({ carriers: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to fetch carriers',
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
