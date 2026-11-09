import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { BrandOrbit } from '../components/BrandOrbit'
import { OrbitMenu } from '../components/OrbitMenu'
import {
  BookmarkIcon,
  CalendarIcon,
  CheckIcon,
  GraduationIcon,
  LogoutIcon,
  SparkIcon,
  TargetIcon,
} from '../components/Icons'
import {
  ApiError,
  dashboardRequest,
  type DailyStat,
  type Dashboard,
} from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import '../styles/landing.css'
import '../styles/home.css'

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function greetingFor(hour: number): string {
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 14) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function parseDateOnly(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function memberSince(value?: string): string {
  if (!value) return 'hôm nay'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'hôm nay'
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDueDate(value: string): string {
  const date = parseDateOnly(value)
  if (!date) return value
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function chartHeight(day: DailyStat, max: number): number {
  const total = day.wordsLearned + day.wordsReviewed
  if (total === 0) return 3
  return Math.max(8, Math.round((total / max) * 100))
}

export function HomePage() {
  const navigate = useNavigate()
  const { user, session, refresh, logout } = useAuth()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const accessToken = session?.accessToken
  const accountEmail = user?.email

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError('')

    try {
      let data: Dashboard
      try {
        data = await dashboardRequest(accessToken)
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          const next = await refresh()
          data = await dashboardRequest(next.accessToken)
        } else {
          throw caught
        }
      }
      setDashboard(data)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        await logout()
        navigate('/login', { replace: true, state: { email: accountEmail } })
        return
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa tải được dữ liệu học tập. Vui lòng thử lại.',
      )
    } finally {
      setLoading(false)
    }
  }, [accessToken, accountEmail, logout, navigate, refresh])

  useEffect(() => {
    void load()
  }, [load])

  async function handleLogout() {
    setLeaving(true)
    await logout()
    navigate('/welcome', { replace: true })
  }

  const profile = dashboard?.user ?? user
  if (!profile) return null

  const displayName = profile.displayName.trim() || 'bạn'
  const firstName = displayName.split(' ').slice(-1)[0] ?? displayName
  const initial = displayName.charAt(0).toUpperCase()

  const now = new Date()
  const hour = now.getHours()
  const dateLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(now)
  const capitalDate = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const today = dashboard?.today
  const goal = Math.max(1, today?.dailyGoal ?? profile.dailyWordGoal ?? 20)
  const learned = today?.wordsLearned ?? 0
  const reviewed = today?.wordsReviewed ?? 0
  const minutes = today?.minutesStudied ?? 0
  const goalMet = today?.goalMet ?? false
  const remaining = Math.max(0, goal - learned)
  const goalPct = Math.min(100, Math.round((learned / goal) * 100))

  const totalWords = dashboard?.totalWords ?? 0
  const masteredWords = dashboard?.masteredWords ?? 0
  const dueCount = dashboard?.dueCount ?? 0
  const streakDays = dashboard?.streakDays ?? 0

  const weekly = dashboard?.weekly ?? []
  const weekMax = Math.max(1, ...weekly.map((day) => day.wordsLearned + day.wordsReviewed))
  const weekTotal = weekly.reduce((sum, day) => sum + day.wordsLearned + day.wordsReviewed, 0)
  const todayKey = dayKey(now)

  const skills = dashboard?.skills ?? []
  const nextTask = dashboard?.nextTask ?? null

  const levelLabel =
    profile.levelCode && profile.levelName
      ? `${profile.levelCode} · ${profile.levelName}`
      : 'Chưa chọn trình độ'

  const heroLine = goalMet
    ? 'Bạn đã chạm mục tiêu hôm nay. Một chút ôn tập nhẹ nhàng sẽ giúp những từ mới đọng lại lâu hơn.'
    : learned === 0
      ? `Hôm nay bạn chưa học từ nào. Mục tiêu ${goal} từ đang chờ — bắt đầu nhẹ nhàng thôi.`
      : `Bạn đã học ${learned} từ, còn ${remaining} từ nữa để hoàn thành mục tiêu ${goal} từ hôm nay.`

  const stats = [
    {
      label: 'Từ trong sổ',
      value: totalWords,
      hint: 'Tổng số từ đã lưu',
      icon: BookmarkIcon,
    },
    {
      label: 'Đã thuộc',
      value: masteredWords,
      hint: 'Từ đã ghi nhớ',
      icon: CheckIcon,
    },
    {
      label: 'Cần ôn hôm nay',
      value: dueCount,
      hint: 'Theo lịch ôn thông minh',
      icon: CalendarIcon,
    },
    {
      label: 'Chuỗi ngày',
      value: streakDays,
      hint: 'Ngày học liên tiếp',
      icon: SparkIcon,
    },
  ]

  return (
    <div className={`home${leaving ? ' is-leaving' : ''}`}>
      <div
        className="home__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="home__veil" aria-hidden="true" />

      <header className="site-header">
        <div className="site-shell site-header__inner">
          <div className="home-brand-group">
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
              onClick={() => setMenuOpen(true)}
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
              onClick={handleLogout}
              disabled={leaving}
            >
              <LogoutIcon size={17} />
              {leaving ? 'Đang thoát...' : 'Đăng xuất'}
            </button>
          </div>
        </div>
      </header>

      <main className="home__main">
        {loading && !dashboard ? (
          <section className="home-state site-shell" aria-live="polite">
            <span className="spinner spinner--dark" aria-hidden="true" />
            <p>Đang mở bầu trời học tập của bạn...</p>
          </section>
        ) : null}

        {!loading && error ? (
          <section className="home-state site-shell" role="alert">
            <p>{error}</p>
            <button type="button" className="btn btn--primary" onClick={() => void load()}>
              Thử lại
            </button>
          </section>
        ) : null}

        {dashboard ? (
          <>
            <section className="home-hero site-shell">
              <div className="home-hero__copy">
                <span className="hero__pill">
                  <SparkIcon size={16} />
                  {capitalDate}
                </span>
                <h1>
                  {greetingFor(hour)}, <em>{firstName}</em>.
                </h1>
                <p>{heroLine}</p>

                <div className="home-badges">
                  <span className="home-badge">
                    <GraduationIcon size={16} />
                    {levelLabel}
                  </span>
                  <span className="home-badge">
                    <TargetIcon size={16} />
                    Mục tiêu {goal} từ/ngày
                  </span>
                  <span className="home-badge">
                    <CalendarIcon size={16} />
                    Thành viên từ {memberSince(profile.createdAt)}
                  </span>
                </div>
              </div>

              <div className="goal-card">
                <div className="goal-card__ring">
                  <svg viewBox="0 0 160 160" role="img" aria-label={`${learned} trên ${goal} từ hôm nay`}>
                    <defs>
                      <linearGradient id="goalGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6ab9ef" />
                        <stop offset="100%" stopColor="#1c6fb2" />
                      </linearGradient>
                    </defs>
                    <circle className="goal-card__track" cx="80" cy="80" r="66" />
                    <circle
                      className="goal-card__value"
                      cx="80"
                      cy="80"
                      r="66"
                      pathLength={100}
                      strokeDasharray="100"
                      strokeDashoffset={100 - goalPct}
                    />
                  </svg>
                  <div className="goal-card__center">
                    <strong>
                      {learned}
                      <span>/{goal}</span>
                    </strong>
                    <em>từ hôm nay</em>
                  </div>
                </div>

                <div className="goal-card__side">
                  <span className="goal-card__eyebrow">
                    {goalMet ? 'Mục tiêu đã đạt' : 'Mục tiêu hôm nay'}
                  </span>
                  <strong>{goalPct}%</strong>
                  <span className="goal-card__caption">
                    {goalMet
                      ? 'Tuyệt vời, hôm nay bạn đã hoàn thành mục tiêu. Giữ nhịp này nhé!'
                      : remaining === 0
                        ? 'Chỉ còn một bước nhỏ là chạm mục tiêu.'
                        : `Còn ${remaining} từ để hoàn thành mục tiêu ${goal} từ.`}
                  </span>
                  <div className="goal-card__mini">
                    <span>
                      <b>{reviewed}</b> từ đã ôn
                    </span>
                    <span>
                      <b>{minutes}</b> phút học
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="home-stats site-shell" aria-label="Thống kê học tập">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <article key={stat.label} className="stat-card">
                    <span className="stat-card__icon">
                      <Icon size={18} />
                    </span>
                    <strong className="stat-card__value">{stat.value}</strong>
                    <span className="stat-card__label">{stat.label}</span>
                    <span className="stat-card__hint">{stat.hint}</span>
                  </article>
                )
              })}
            </section>

            {totalWords === 0 ? (
              <section className="home-empty site-shell">
                <span className="home-empty__icon">
                  <BookmarkIcon size={22} />
                </span>
                <div>
                  <h2>Sổ từ của bạn đang trống</h2>
                  <p>
                    Khi bạn lưu từ đầu tiên, tiến độ, chuỗi ngày và lịch ôn tập sẽ
                    xuất hiện tại đây.
                  </p>
                </div>
              </section>
            ) : null}

            <section className="home-panels site-shell">
              <article className="panel panel--week">
                <div className="panel__head">
                  <div>
                    <span className="panel__eyebrow">Nhịp học 7 ngày</span>
                    <h2>Hoạt động gần đây</h2>
                  </div>
                  <span className="panel__total">{weekTotal} lượt từ</span>
                </div>

                <div className="week-chart" role="img" aria-label="Số từ học và ôn trong 7 ngày gần nhất">
                  {weekly.map((day) => {
                    const date = parseDateOnly(day.date)
                    const total = day.wordsLearned + day.wordsReviewed
                    const isToday = day.date === todayKey
                    return (
                      <div
                        key={day.date}
                        className={`week-chart__col${isToday ? ' is-today' : ''}`}
                        title={`${day.date}: ${total} lượt từ`}
                      >
                        <span className="week-chart__value">{total > 0 ? total : ''}</span>
                        <span className="week-chart__track">
                          <span
                            className="week-chart__fill"
                            style={{ height: `${chartHeight(day, weekMax)}%` }}
                          />
                        </span>
                        <span className="week-chart__day">
                          {date ? WEEKDAY_SHORT[date.getDay()] : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="panel__note">
                  Cột càng cao, bạn càng chạm nhiều từ trong ngày.
                </p>
              </article>

              <div className="home-panels__side">
                {nextTask ? (
                  <article className="panel panel--next">
                    <span className="panel__eyebrow">Việc tiếp theo</span>
                    <h2>{nextTask.title}</h2>
                    <p>
                      {nextTask.skillNameVi} · Hạn {formatDueDate(nextTask.dueDate)}
                    </p>
                  </article>
                ) : null}

                <article className="panel panel--skills">
                  <div className="panel__head">
                    <div>
                      <span className="panel__eyebrow">Hồ sơ năng lực</span>
                      <h2>Kỹ năng</h2>
                    </div>
                    <span className="panel__total">/100</span>
                  </div>

                  {skills.length > 0 ? (
                    <div className="skill-list">
                      {skills.map((skill) => (
                        <div key={skill.skillId} className="skill">
                          <div className="skill__head">
                            <span>{skill.nameVi}</span>
                            <strong>{Math.round(skill.score)}</strong>
                          </div>
                          <span className="skill__track">
                            <span
                              className="skill__fill"
                              style={{
                                width: `${Math.min(100, Math.max(0, skill.score))}%`,
                              }}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="panel__note">Chưa có dữ liệu kỹ năng.</p>
                  )}

                  <p className="panel__note">
                    Điểm ước tính, cập nhật sau mỗi bài luyện.
                  </p>
                </article>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <footer className="home__foot site-shell">
        <span>© 2026 SkyWord English</span>
        <Link to="/welcome">Giới thiệu SkyWord</Link>
      </footer>

      <OrbitMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={firstName}
      />
    </div>
  )
}
