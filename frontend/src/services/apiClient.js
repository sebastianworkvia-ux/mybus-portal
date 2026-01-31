import axios from 'axios'

// Development: używa Vite proxy (/api → localhost:5000)
// Production: używa VITE_API_URL z environment variables
// Fallback dla custom hostingu bez rewrite /api
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) return envUrl

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'my-bus.eu' || host.endsWith('.my-bus.eu')) {
      return 'https://mybus-backend-aygc.onrender.com/api'
    }
  }

  return '/api'
}

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'Accept-Charset': 'utf-8'
  },
  timeout: 60000 // 60 sekund (dla "wake up" Render free tier - pierwsze połączenie może trwać 30-60s)
})

// Request interceptor - dodaj JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tylko 401 (Unauthorized) powinien wylogować użytkownika
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token')
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      const pathname = window.location.pathname
      const protectedPrefixes = [
        '/dashboard',
        '/add-carrier',
        '/edit-carrier',
        '/admin',
        '/settings',
        '/messages'
      ]
      const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
      const isAuthRoute = pathname === '/login' || pathname === '/register'

      // Redirect tylko jeśli mieliśmy token i jesteśmy na chronionej stronie
      // I NIE jesteśmy już na stronie logowania (zapobiega pętli)
      if (token && isProtectedRoute && !isAuthRoute) {
        // Dodaj timestamp żeby zapobiec wielokrotnym redirectom
        const lastRedirect = sessionStorage.getItem('lastAuthRedirect')
        const now = Date.now()
        
        if (!lastRedirect || now - parseInt(lastRedirect) > 5000) {
          sessionStorage.setItem('lastAuthRedirect', now.toString())
          window.location.href = '/login'
        }
      }
    }
    
    // Loguj inne błędy (429, 500, etc) ale nie redirectuj
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded - zbyt wiele żądań')
    } else if (error.response?.status >= 500) {
      console.error('Błąd serwera:', error.response.status)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
