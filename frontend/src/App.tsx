import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ContextPage } from './pages/ContextPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PlanPage } from './pages/PlanPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { SplashPage } from './pages/SplashPage'
import { StatsPage } from './pages/StatsPage'
import { WordBookPage } from './pages/WordBookPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to="/app" replace /> : <>{children}</>
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }
  return <>{children}</>
}

function Fallback() {
  const { user } = useAuth()
  return <Navigate to={user ? '/app' : '/welcome'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/onboarding"
          element={
            <GuestOnly>
              <OnboardingPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/context"
          element={
            <RequireAuth>
              <ContextPage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/words"
          element={
            <RequireAuth>
              <WordBookPage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/stats"
          element={
            <RequireAuth>
              <StatsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/plan"
          element={
            <RequireAuth>
              <PlanPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Fallback />} />
      </Routes>
    </AuthProvider>
  )
}
