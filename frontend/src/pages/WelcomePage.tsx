import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { BrandOrbit } from '../components/BrandOrbit'
import {
  CalendarIcon,
  CheckIcon,
  GraduationIcon,
  LogoutIcon,
  MailIcon,
  SparkIcon,
  TargetIcon,
} from '../components/Icons'
import { ApiError, dashboardRequest, type Dashboard } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import '../styles/welcome.css'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function WelcomePage() {
  const navigate = useNavigate()
  const { user, session, refresh, logout } = useAuth()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [statsError, setStatsError] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function loadDashboard() {
      try {
        const data = await dashboardRequest(session!.accessToken)
        if (!cancelled) {
          setDashboard(data)
          setStatsError(false)
        }
      } catch (caught) {
        const status = caught instanceof ApiError ? caught.status : (caught as { status?: number })?.status
        if (status === 401) {
          try {
            const next = await refresh()
            const data = await dashboardRequest(next.accessToken)
            if (!cancelled) {
              setDashboard(data)
              setStatsError(false)
            }
            return
          } catch {
            // Refresh token cũng hết hạn; người dùng có thể đăng xuất và đăng nhập lại.
          }
        }
        if (!cancelled) setStatsError(true)
      }
    }

    void loadDashboard()
    return () => {
      cancelled = true
    }
  }, [session, refresh])

  async function handleLogout() {
    setLeaving(true)
    await logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  const initial = user.displayName.trim().charAt(0).toUpperCase() || 'S'
  const levelLabel = user.levelCode ? `${user.levelCode} · ${user.levelName ?? ''}`.trim() : 'Để sau'

  return (
    <div className={`welcome${leaving ? ' is-leaving' : ''}`}>
      <div
        className="welcome__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="welcome__veil" aria-hidden="true" />

      <header className="welcome__top">
        <div className="welcome__brand">
          <BrandOrbit size={38} />
          <div>
            <strong>SkyWord</strong>
            <span>English</span>
          </div>
        </div>

        <div className="welcome__account">
          <span className="welcome__avatar">{initial}</span>
          <div className="welcome__identity">
            <strong>{user.displayName}</strong>
            <span>{user.email}</span>
          </div>
          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            <LogoutIcon size={17} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="welcome__main">
        <section className="welcome__hero">
          <span className="welcome__pill">
            <SparkIcon size={15} />
            Tài khoản đã sẵn sàng
          </span>
          <h1>
            Xin chào, <span>{user.displayName}</span>!
          </h1>
          <p>
            Bầu trời của bạn đã mở. Đây là ngày đầu tiên trên hành trình tiếng Anh —
            mọi thứ đều bắt đầu từ một từ mới.
          </p>

          <div className="welcome__stats">
            <div className="stat-card">
              <span className="stat-card__icon">
                <SparkIcon size={18} />
              </span>
              <strong>{dashboard?.streakDays ?? 0}</strong>
              <span>ngày liên tiếp</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__icon">
                <TargetIcon size={18} />
              </span>
              <strong>{dashboard?.dueCount ?? 0}</strong>
              <span>từ đến hạn</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__icon">
                <GraduationIcon size={18} />
              </span>
              <strong>{dashboard?.totalWords ?? 0}</strong>
              <span>từ trong sổ</span>
            </div>
          </div>

          {statsError ? (
            <p className="welcome__hint">
              Chưa tải được số liệu học tập. Bạn vẫn có thể dùng ứng dụng bình thường.
            </p>
          ) : null}
        </section>

        <aside className="profile-card">
          <div className="profile-card__head">
            <div>
              <span className="profile-card__eyebrow">Hồ sơ của bạn</span>
              <h2>Thông tin tài khoản</h2>
            </div>
            <span className="profile-card__badge">
              <CheckIcon size={14} />
              Đã xác thực
            </span>
          </div>

          <dl className="profile-list">
            <div>
              <dt>
                <MailIcon size={17} />
                Email
              </dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>
                <GraduationIcon size={17} />
                Trình độ
              </dt>
              <dd>{levelLabel}</dd>
            </div>
            <div>
              <dt>
                <TargetIcon size={17} />
                Mục tiêu mỗi ngày
              </dt>
              <dd>{user.dailyWordGoal} từ</dd>
            </div>
            <div>
              <dt>
                <CalendarIcon size={17} />
                Thành viên từ
              </dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          </dl>

          <div className="profile-card__next">
            <span>Bước tiếp theo</span>
            <p>
              Giao diện học tập đầy đủ — từ điển theo ngữ cảnh, sổ từ và lộ trình —
              sẽ được nối vào tài khoản này ở bước kế tiếp.
            </p>
          </div>
        </aside>
      </main>

      <p className="welcome__foot">
        SkyWord English · Phiên đăng nhập được bảo vệ bằng JWT và refresh token
      </p>
    </div>
  )
}
