import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { AppHeader } from './AppHeader'
import { OrbitMenu } from './OrbitMenu'
import { useAuth } from '../lib/AuthContext'
import '../styles/landing.css'
import '../styles/home.css'
import '../styles/app-shell.css'

type AppScaffoldProps = {
  children: ReactNode
  className?: string
}

export function AppScaffold({ children, className = '' }: AppScaffoldProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  if (!user) return null

  const displayName = user.displayName.trim() || 'bạn'
  const firstName = displayName.split(' ').slice(-1)[0] ?? displayName
  const initial = displayName.charAt(0).toUpperCase()

  async function handleLogout() {
    setLeaving(true)
    await logout()
    navigate('/welcome', { replace: true })
  }

  return (
    <div className={`app-page ${className}`.trim()}>
      <div
        className="app-page__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="app-page__veil" aria-hidden="true" />
      <div className="app-page__aura" aria-hidden="true" />

      <AppHeader
        displayName={displayName}
        initial={initial}
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onLogout={handleLogout}
        leaving={leaving}
      />

      <main className="app-page__main">{children}</main>

      <footer className="home__foot site-shell">
        <span>© 2026 SkyWord English</span>
        <Link to="/welcome">Giới thiệu SkyWord</Link>
      </footer>

      <OrbitMenu open={menuOpen} onClose={() => setMenuOpen(false)} userName={firstName} />
    </div>
  )
}
