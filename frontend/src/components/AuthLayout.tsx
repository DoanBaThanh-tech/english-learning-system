import type { ReactNode } from 'react'
import skyBackground from '../assets/sky-background.webp'
import { BrandOrbit } from './BrandOrbit'

type AuthLayoutProps = {
  variant: 'login' | 'register'
  children: ReactNode
}

export function AuthLayout({ variant, children }: AuthLayoutProps) {
  return (
    <div className={`auth auth--${variant}`}>
      <div
        className="auth__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="auth__veil" aria-hidden="true" />
      <div className="auth__cloud auth__cloud--one" aria-hidden="true" />
      <div className="auth__cloud auth__cloud--two" aria-hidden="true" />

      <main className="auth__card">
        <header className="auth__brand">
          <BrandOrbit size={44} />
          <div className="auth__wordmark">
            <strong>SkyWord</strong>
            <span>English</span>
          </div>
        </header>
        {children}
      </main>

      <p className="auth__footnote">© 2026 SkyWord English · Học theo quỹ đạo của riêng bạn</p>
    </div>
  )
}
