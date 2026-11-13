import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SkyLogo } from '../SkyLogo'
import { NimboMascot, type NimboPose } from '../mascot/NimboMascot'

type Props = {
  children: ReactNode
  pose?: NimboPose
  mascotSize?: number
  eyebrow: string
  title: ReactNode
  lead: ReactNode
}

export function AuthShell({
  children,
  pose = 'wave',
  mascotSize = 150,
  eyebrow,
  title,
  lead,
}: Props) {
  return (
    <div className="auth-page">
      <span className="auth-deco auth-deco--a" aria-hidden="true">A</span>
      <span className="auth-deco auth-deco--b" aria-hidden="true">θ</span>
      <span className="auth-deco auth-deco--c" aria-hidden="true">B2</span>

      <header className="auth-page__top sky-shell">
        <SkyLogo />
        <Link to="/welcome" className="welcome__link">← Trang giới thiệu</Link>
      </header>

      <main className="auth-page__main">
        <div className="auth-nimbo">
          <NimboMascot pose={pose} size={mascotSize} ariaLabel="Nimbo chào bạn" />
        </div>
        <div className="auth-intro">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
        <div className="auth-card card">{children}</div>
      </main>

      <footer className="auth-page__foot">
        <span>© 2026 SkyWorld</span>
        <span>Học mỗi ngày cùng Nimbo.</span>
      </footer>
    </div>
  )
}
