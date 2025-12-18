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

export const reviewService = {
  getReviewsByCarrier: (carrierId) => apiClient.get(`/reviews/carrier/${carrierId}`),
  createReview: (data) => apiClient.post('/reviews', data),
  updateReview: (reviewId, data) => apiClient.put(`/reviews/${reviewId}`, data),
  deleteReview: (reviewId) => apiClient.delete(`/reviews/${reviewId}`)
}

export const paymentService = {
  createPayment: (data) => apiClient.post('/payments/create', data),
  getPaymentStatus: (paymentId) => apiClient.get(`/payments/${paymentId}/status`),
  getPaymentHistory: () => apiClient.get('/payments/history'),
  cancelPayment: (paymentId) => apiClient.delete(`/payments/${paymentId}/cancel`)
}
