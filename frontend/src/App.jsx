import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import { trackPageView } from './utils/analytics'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import CookiesPage from './pages/CookiesPage'
import ForCarriersPage from './pages/ForCarriersPage'
import CarrierDetailsPage from './pages/CarrierDetailsPage'
import DashboardPage from './pages/DashboardPage'
import AddCarrierPage from './pages/AddCarrierPage'
import EditCarrierPage from './pages/EditCarrierPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminVerifyPage from './pages/AdminVerifyPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminStatsPage from './pages/AdminStatsPage'
import UserSettingsPage from './pages/UserSettingsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import MapPage from './pages/MapPage'
import PricingPage from './pages/PricingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import { startKeepAlive } from './utils/keepAlive'
import './App.css'

// Component that tracks page views
function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track current page
    trackPageView(location.pathname)
  }, [location])

  return null
}

function App() {
  // Uruchom automatyczne pingowanie backendu aby nie zasnął (Render free tier)
  useEffect(() => {
    startKeepAlive()
  }, [])

  return (
    <BrowserRouter>
      <PageViewTracker />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/carrier/:id" element={<CarrierDetailsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/add-carrier" element={<AddCarrierPage />} />
          <Route path="/edit-carrier/:id" element={<EditCarrierPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/verify" element={<AdminVerifyPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
          <Route path="/settings" element={<UserSettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/for-carriers" element={<ForCarriersPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </BrowserRouter>
  )
}

export default App
