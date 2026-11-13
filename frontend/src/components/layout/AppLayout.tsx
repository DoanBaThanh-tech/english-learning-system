import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { SkyLogo } from '../SkyLogo'
import { NimboMascot } from '../mascot/NimboMascot'
import {
  BookIcon,
  BookmarkIcon,
  ChartIcon,
  ChatIcon,
  FlameIcon,
  LogoutIcon,
  MicIcon,
  SearchIcon,
  SparkIcon,
  TargetIcon,
  UserIcon,
} from '../Icons'
import { dashboardRequest, type Dashboard } from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import { useAuthedApi } from '../../lib/useAuthedApi'
import '../../styles/app.css'

const NAV = [
  { to: '/app', label: 'Học', icon: BookIcon, end: true },
  { to: '/app/dictionary', label: 'Từ điển', icon: SearchIcon },
  { to: '/app/vocabulary', label: 'Sổ từ vựng', icon: BookmarkIcon },
  { to: '/app/speaking', label: 'Luyện nói', icon: MicIcon },
  { to: '/app/chat', label: 'Trò chuyện', icon: ChatIcon },
  { to: '/app/reading', label: 'Bài đọc', icon: BookIcon },
  { to: '/app/stats', label: 'Thống kê', icon: ChartIcon },
  { to: '/app/profile', label: 'Hồ sơ', icon: UserIcon },
]

const MOBILE_NAV = [
  { to: '/app', label: 'Học', icon: BookIcon, end: true },
  { to: '/app/dictionary', label: 'Từ điển', icon: SearchIcon },
  { to: '/app/vocabulary', label: 'Sổ từ', icon: BookmarkIcon },
  { to: '/app/speaking', label: 'Luyện nói', icon: MicIcon },
  { to: '/app/profile', label: 'Hồ sơ', icon: UserIcon },
]

const WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export type AppOutletContext = {
  dashboard: Dashboard | null
  loading: boolean
  error: string
  reload: () => void
}

export function useAppData(): AppOutletContext {
  return useOutletContext<AppOutletContext>()
}

export function AppLayout() {
  const { user, logout, updateUser } = useAuth()
  const { run } = useAuthedApi()
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    setLoading(true)
    setError('')
    run((token) => dashboardRequest(token))
      .then((data) => {
        setDashboard(data)
        updateUser(data.user)
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Chưa tải được dữ liệu.')
      })
      .finally(() => setLoading(false))
  }, [run, updateUser])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleLogout() {
    await logout()
    navigate('/welcome', { replace: true })
  }

  const displayName = dashboard?.user.displayName ?? user?.displayName ?? 'bạn'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'S'
  const today = dashboard?.today
  const goal = Math.max(1, today?.dailyGoal ?? user?.dailyWordGoal ?? 20)
  const learned = today?.wordsLearned ?? 0
  const due = dashboard?.dueCount ?? 0
  const streak = dashboard?.streakDays ?? 0
  const goalPct = Math.min(100, Math.round((learned / goal) * 100))
  const todayIndex = (new Date().getDay() + 6) % 7

  const tip = today?.goalMet
    ? 'Bạn đã chạm mục tiêu hôm nay. Ôn nhẹ vài từ hoặc nghỉ ngơi nhé!'
    : due > 0
      ? `Có ${due} từ đang đến hạn ôn. Dành 2 phút ôn trước khi học từ mới nhé?`
      : (dashboard?.totalWords ?? 0) === 0
        ? 'Thử tra một câu ở Từ điển, rồi lưu từ đầu tiên vào sổ nhé!'
        : 'Mỗi ngày một chút là đủ. Bắt đầu với 5 từ mới thôi!'

  const pageLabel =
    NAV.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )?.label ?? 'SkyWorld'

  const isLesson = location.pathname.startsWith('/app/lesson/')

  return (
    <div className={`app${isLesson ? ' app--lesson' : ''}`}>
      <aside className="app__side">
        <SkyLogo />
        <nav className="app__nav" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `app__nav-item${isActive ? ' is-active' : ''}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="app__side-foot">
          <div className="app__user">
            <span className="avatar">{initial}</span>
            <span className="app__user-copy">
              <strong>{displayName}</strong>
              <em>{user?.levelCode ? `Trình độ ${user.levelCode}` : 'Thành viên SkyWorld'}</em>
            </span>
          </div>
          <button type="button" className="app__logout" onClick={handleLogout}>
            <LogoutIcon size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="app__mobile-head">
        <SkyLogo compact />
        <span className="app__mobile-page">{pageLabel}</span>
        <Link to="/app/profile" className="avatar" aria-label="Mở hồ sơ">
          {initial}
        </Link>
      </header>

      <main className="app__main">
        <Outlet context={{ dashboard, loading, error, reload }} />
      </main>

      {!isLesson ? (
        <aside className="app__rail">
          <section className="rail-card rail-card--streak">
            <span className="rail-card__eyebrow">
              <FlameIcon size={14} /> Chuỗi ngày
            </span>
            <strong className="rail-card__big">{streak}</strong>
            <div className="rail-week" aria-hidden="true">
              {WEEK.map((day, index) => (
                <span key={day} className={index <= todayIndex && streak > 0 ? 'on' : ''}>
                  {day}
                </span>
              ))}
            </div>
            <p>Ngày học liên tiếp của bạn.</p>
          </section>

          <section className="rail-card">
            <span className="rail-card__eyebrow">
              <TargetIcon size={14} /> Mục tiêu hôm nay
            </span>
            <div className="rail-goal">
              <strong>{learned}</strong>
              <span>/ {goal} từ</span>
            </div>
            <div className="progress progress--gold">
              <i style={{ width: `${goalPct}%` }} />
            </div>
            <p>{goalPct >= 100 ? 'Đã đạt mục tiêu. Tuyệt vời!' : `Còn ${Math.max(0, goal - learned)} từ nữa.`}</p>
            <Link to="/app/review" className="rail-link">
              Ôn nhanh {due > 0 ? `${due} từ đến hạn` : 'cùng Nimbo'} →
            </Link>
          </section>

          <section className="rail-card rail-card--nimbo">
            <NimboMascot pose={today?.goalMet ? 'cheer' : 'idle'} size={104} ariaLabel="Nimbo gợi ý" />
            <div>
              <span className="rail-card__eyebrow">
                <SparkIcon size={14} /> Nimbo nhắc bạn
              </span>
              <p>{tip}</p>
            </div>
          </section>

          {error ? (
            <button type="button" className="rail-retry" onClick={reload}>
              {error} · Thử lại
            </button>
          ) : null}
        </aside>
      ) : null}

      {!isLesson ? (
        <nav className="app__tabs" aria-label="Điều hướng di động">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `app__tab${isActive ? ' is-active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      ) : null}

      <div className="visually-hidden" aria-live="polite">
        {loading ? 'Đang tải dữ liệu' : ''}
      </div>
    </div>
  )
}
