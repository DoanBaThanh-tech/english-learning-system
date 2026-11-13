import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { WelcomePage } from './pages/WelcomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { LearnPage } from './pages/LearnPage'
import { LessonPage } from './pages/LessonPage'
import { DictionaryPage } from './pages/DictionaryPage'
import { VocabularyPage } from './pages/VocabularyPage'
import { ReviewPage } from './pages/ReviewPage'
import { PracticePage } from './pages/PracticePage'
import { SpeakingPage } from './pages/SpeakingPage'
import { ChatPage } from './pages/ChatPage'
import { ReadingPage } from './pages/ReadingPage'
import { StatsPage } from './pages/StatsPage'
import { ProfilePage } from './pages/ProfilePage'

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
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

function Fallback() {
  const { user } = useAuth()
  return <Navigate to={user ? '/app' : '/'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/welcome" element={<Navigate to="/" replace />} />

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
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<LearnPage />} />
          <Route path="lesson/:levelId" element={<LessonPage />} />
          <Route path="dictionary" element={<DictionaryPage />} />
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="speaking" element={<SpeakingPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="reading" element={<ReadingPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Đường dẫn SkyWord cũ: giữ để bookmark không bị 404. */}
        <Route path="/app/words" element={<Navigate to="/app/vocabulary" replace />} />
        <Route path="/app/context" element={<Navigate to="/app/dictionary" replace />} />
        <Route path="/app/plan" element={<Navigate to="/app" replace />} />

        <Route path="*" element={<Fallback />} />
      </Routes>
    </AuthProvider>
  )
}
