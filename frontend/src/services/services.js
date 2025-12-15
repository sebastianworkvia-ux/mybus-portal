import apiClient from './apiClient'

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/profile')
}

export const carrierService = {
  getCarriers: (params) => apiClient.get('/carriers', { params }),
  getCarrierById: (id) => apiClient.get(`/carriers/${id}`),
  createCarrier: (data) => apiClient.post('/carriers', data),
  updateCarrier: (data) => apiClient.put('/carriers', data),
  deleteCarrier: () => apiClient.delete('/carriers')
}
