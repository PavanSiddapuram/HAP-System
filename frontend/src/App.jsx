import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import BookAppointmentPage from './pages/BookAppointmentPage'
import AppointmentHistoryPage from './pages/AppointmentHistoryPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
        <div className="page-loader-text">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
        <div className="page-loader-text">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function ProtectedLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <BookAppointmentPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <AppointmentHistoryPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
