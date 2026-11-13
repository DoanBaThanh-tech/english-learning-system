import { Link } from 'react-router-dom'
import { BrandOrbit } from './BrandOrbit'
import { LogoutIcon } from './Icons'

type AppHeaderProps = {
  displayName: string
  initial: string
  menuOpen: boolean
  onOpenMenu: () => void
  onLogout: () => void
  leaving?: boolean
}

export function AppHeader({
  displayName,
  initial,
  menuOpen,
  onOpenMenu,
  onLogout,
  leaving = false,
}: AppHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-shell site-header__inner">
        <div className="app-brand-group">
          <Link to="/app" className="site-brand" aria-label="SkyWord English - trang chủ">
            <BrandOrbit size={42} />
            <span className="site-brand__word">
              <strong>SkyWord</strong>
              <em>English</em>
            </span>
          </Link>

          <button
            type="button"
            className="menu-toggle"
            onClick={onOpenMenu}
            aria-label="Mở menu chức năng"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="orbit-menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="site-actions">
          <span className="site-user">
            <span className="site-user__avatar">{initial}</span>
            <span className="site-user__label">
              Xin chào, <strong>{displayName}</strong>
            </span>
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--compact"
            onClick={onLogout}
            disabled={leaving}
          >
            <LogoutIcon size={17} />
            {leaving ? 'Đang thoát...' : 'Đăng xuất'}
          </button>
        </div>
      </div>
    </header>
  )
}
