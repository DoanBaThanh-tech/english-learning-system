import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppScaffold } from '../components/AppScaffold'
import {
  BookmarkIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  FlameIcon,
  LayersIcon,
  PlayIcon,
  SparkIcon,
  TargetIcon,
  TrendingIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  ApiError,
  statsDailyRequest,
  statsHeatmapRequest,
  statsOverviewRequest,
  statsSkillsRequest,
  studySessionsRequest,
  type DailyStat,
  type Heatmap,
  type SkillRadar,
  type StatsOverview,
  type StudySession,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/stats.css'

const PERIODS = [14, 30, 90] as const
type Period = (typeof PERIODS)[number]

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function shiftIso(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function shortDate(value: string): string {
  const [, month, day] = value.split('-').map(Number)
  return `${day}/${month}`
}

function longDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function sessionDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} giờ` : `${hours}g ${rest}p`
}

function buildWeeks(data: Heatmap['data']): (Heatmap['data'][number] | null)[][] {
  if (data.length === 0) return []
  const first = new Date(`${data[0].date}T00:00:00`)
  const offset = (first.getDay() + 6) % 7
  const cells: (Heatmap['data'][number] | null)[] = Array.from({ length: offset }, () => null)
  cells.push(...data)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Heatmap['data'][number] | null)[][] = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }
  return weeks
}

function radarPoint(index: number, total: number, value: number, radius: number) {
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180)
  const scaled = (Math.max(0, Math.min(100, value)) / 100) * radius
  return {
    x: 180 + scaled * Math.cos(angle),
    y: 150 + scaled * Math.sin(angle),
  }
}

function polygonPoints(values: number[], radius: number): string {
  return values
    .map((value, index) => {
      const point = radarPoint(index, values.length, value, radius)
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`
    })
    .join(' ')
}

export function StatsPage() {
  const { run } = useAuthedApi()

  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [daily, setDaily] = useState<DailyStat[]>([])
  const [heatmap, setHeatmap] = useState<Heatmap | null>(null)
  const [radar, setRadar] = useState<SkillRadar | null>(null)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [period, setPeriod] = useState<Period>(30)
  const [anchor, setAnchor] = useState('')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState('')
  const [chartError, setChartError] = useState('')

  const loadBase = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextOverview, nextHeatmap, nextRadar, nextSessions] = await Promise.all([
        run((token) => statsOverviewRequest(token)),
        run((token) => statsHeatmapRequest(token, 90)),
        run((token) => statsSkillsRequest(token)),
        run((token) => studySessionsRequest(token, 8)),
      ])
      setOverview(nextOverview)
      setHeatmap(nextHeatmap)
      setRadar(nextRadar)
      setSessions(nextSessions)
      setDaily(nextOverview.last14Days)
      setAnchor(nextOverview.last14Days.at(-1)?.date ?? todayIso())
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa tải được thống kê. Vui lòng thử lại.',
      )
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    void loadBase()
  }, [loadBase])

  useEffect(() => {
    if (!anchor) return
    let active = true
    setChartLoading(true)
    setChartError('')
    const from = shiftIso(anchor, -(period - 1))
    run((token) => statsDailyRequest(token, from, anchor))
      .then((data) => {
        if (active) setDaily(data)
      })
      .catch((caught) => {
        if (!active) return
        if (caught instanceof ApiError && caught.status === 401) return
        setChartError(
          caught instanceof ApiError
            ? caught.message
            : 'Chưa tải được hoạt động theo ngày.',
        )
      })
      .finally(() => {
        if (active) setChartLoading(false)
      })
    return () => {
      active = false
    }
  }, [anchor, period, run])

  const chart = useMemo(() => {
    const max = Math.max(1, ...daily.map((day) => day.wordsLearned + day.wordsReviewed))
    const totalWords = daily.reduce(
      (sum, day) => sum + day.wordsLearned + day.wordsReviewed,
      0,
    )
    const totalMinutes = daily.reduce((sum, day) => sum + day.minutesStudied, 0)
    const labelStep = Math.max(1, Math.ceil(daily.length / 6))
    return { max, totalWords, totalMinutes, labelStep }
  }, [daily])

  const skills = radar?.skills ?? overview?.skills ?? []
  const skillValues = skills.map((skill) => Number(skill.score))
  const strongest = radar?.strongestSkill || skills[0]?.nameVi || '—'
  const weakest = radar?.weakestSkill || skills[skills.length - 1]?.nameVi || '—'
  const skillsBalanced =
    skills.length > 1 &&
    skills.every((skill) => Math.abs(Number(skill.score) - Number(skills[0].score)) < 0.5)
  const weeks = useMemo(() => buildWeeks(heatmap?.data ?? []), [heatmap])
  const hasData = Boolean(overview && (overview.totalAnswers > 0 || overview.totalWords > 0))
  const today = overview?.today
  const goal = Math.max(1, today?.dailyGoal ?? 20)
  const learned = today?.wordsLearned ?? 0
  const goalPct = Math.min(100, Math.round((learned / goal) * 100))

  const kpis = overview
    ? [
        {
          label: 'Chuỗi ngày',
          value: `${overview.streakDays}`,
          unit: 'ngày',
          hint: overview.streakDays > 0 ? 'Giữ nhịp mỗi ngày' : 'Bắt đầu hôm nay',
          icon: FlameIcon,
          tone: 'warm',
        },
        {
          label: 'Thời gian học',
          value: formatMinutes(overview.totalStudyMinutes),
          unit: '',
          hint: `${overview.totalAnswers} câu đã trả lời`,
          icon: ClockIcon,
          tone: 'sky',
        },
        {
          label: 'Độ chính xác',
          value: `${overview.accuracyPct}`,
          unit: '%',
          hint:
            overview.totalAnswers === 0
              ? 'Chưa có câu trả lời'
              : 'Trên toàn bộ bài đã làm',
          icon: TrendingIcon,
          tone: 'mint',
        },
        {
          label: 'Từ trong sổ',
          value: `${overview.totalWords}`,
          unit: 'từ',
          hint: `${overview.masteredWords} từ đã thuộc`,
          icon: BookmarkIcon,
          tone: 'sky',
        },
        {
          label: 'Cần ôn hôm nay',
          value: `${overview.dueCount}`,
          unit: 'từ',
          hint: overview.dueCount > 0 ? 'Theo lịch SRS' : 'Đang trong nhịp',
          icon: TargetIcon,
          tone: overview.dueCount > 0 ? 'warm' : 'mint',
        },
      ]
    : []

  return (
    <AppScaffold className="stats-page">
      <section className="page-hero site-shell">
        <div className="page-hero__copy">
          <span className="page-eyebrow">
            <ChartIcon size={14} />
            Thống kê tiến bộ
          </span>
          <h1>
            Nhìn lại,
            <br />
            <em>để đi xa hơn.</em>
          </h1>
          <p>
            Mỗi phiên học đều để lại dấu vết. Theo dõi nhịp học, độ chính xác và
            vùng kỹ năng còn yếu — tất cả từ dữ liệu thật của bạn.
          </p>
        </div>
        <div className="page-hero__actions">
          <Link to="/app/words" className="page-btn">
            <BookmarkIcon size={16} />
            Sổ từ
          </Link>
          <Link to="/app/context" className="page-btn page-btn--primary">
            <LayersIcon size={16} />
            Tra ngữ cảnh
          </Link>
        </div>
      </section>

      <div className="site-shell">
        {loading ? (
          <div className="page-state" aria-live="polite">
            <span className="spinner spinner--page" aria-hidden="true" />
            <p>Đang ghép bức tranh tiến bộ của bạn...</p>
          </div>
        ) : error ? (
          <div className="page-state" role="alert">
            <span className="page-state__icon">
              <ChartIcon size={22} />
            </span>
            <h2>Chưa tải được thống kê</h2>
            <p className="page-error">{error}</p>
            <div className="page-state__actions">
              <button type="button" className="page-btn page-btn--primary" onClick={() => void loadBase()}>
                Thử lại
              </button>
            </div>
          </div>
        ) : overview ? (
          <>
            {!hasData ? (
              <section className="stats-start page-card">
                <span className="stats-start__icon">
                  <SparkIcon size={22} />
                </span>
                <div>
                  <span className="page-card__eyebrow">Biểu đồ đang chờ bạn</span>
                  <h2>Phiên học đầu tiên sẽ làm nơi này sống động</h2>
                  <p>
                    Lưu một từ từ trang Ngữ cảnh, rồi mở sổ từ để ôn. Chuỗi ngày,
                    độ chính xác, kỹ năng và bản đồ nhiệt sẽ tự cập nhật sau mỗi
                    câu trả lời.
                  </p>
                </div>
                <div className="stats-start__actions">
                  <Link to="/app/context" className="page-btn page-btn--primary">
                    <LayersIcon size={16} />
                    Tra từ đầu tiên
                  </Link>
                  <Link to="/app/words" className="page-btn">
                    <BookmarkIcon size={16} />
                    Mở sổ từ
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="stats-kpis" aria-label="Chỉ số tổng quan">
              {kpis.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <article key={kpi.label} className={`stats-kpi stats-kpi--${kpi.tone}`}>
                    <span className="stats-kpi__icon">
                      <Icon size={18} />
                    </span>
                    <span className="stats-kpi__label">{kpi.label}</span>
                    <strong className="stats-kpi__value">
                      {kpi.value}
                      {kpi.unit ? <em>{kpi.unit}</em> : null}
                    </strong>
                    <span className="stats-kpi__hint">{kpi.hint}</span>
                  </article>
                )
              })}

              <article className="stats-kpi stats-kpi--goal">
                <div className="stats-goal-ring" aria-hidden="true">
                  <svg viewBox="0 0 100 100">
                    <circle className="stats-goal-ring__track" cx="50" cy="50" r="40" pathLength={100} />
                    <circle
                      className="stats-goal-ring__value"
                      cx="50"
                      cy="50"
                      r="40"
                      pathLength={100}
                      strokeDasharray="100"
                      strokeDashoffset={100 - goalPct}
                    />
                  </svg>
                  <span>{goalPct}%</span>
                </div>
                <div>
                  <span className="stats-kpi__label">Mục tiêu hôm nay</span>
                  <strong className="stats-kpi__value">
                    {learned}
                    <em>/{goal} từ</em>
                  </strong>
                  <span className="stats-kpi__hint">
                    {today?.goalMet ? 'Đã đạt mục tiêu' : 'Tiếp tục nhé'}
                  </span>
                </div>
              </article>
            </section>

            <section className="stats-main">
              <div className="stats-col">
                <article className="page-card stats-chart-card">
                  <div className="page-card__head stats-chart-card__head">
                    <div>
                      <span className="page-card__eyebrow">Nhịp hoạt động</span>
                      <h2>Học và ôn theo từng ngày</h2>
                    </div>
                    <div className="stats-periods" role="group" aria-label="Khoảng thời gian">
                      {PERIODS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`page-tab${period === option ? ' is-active' : ''}`}
                          onClick={() => setPeriod(option)}
                        >
                          {option} ngày
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="stats-chart-meta">
                    <span>
                      <b>{chart.totalWords}</b> lượt từ
                    </span>
                    <span>
                      <b>{formatMinutes(chart.totalMinutes)}</b> học
                    </span>
                    <span className="stats-legend">
                      <i className="stats-legend__learned" /> Từ mới
                      <i className="stats-legend__reviewed" /> Ôn lại
                    </span>
                  </div>

                  {chartError ? (
                    <p className="stats-chart-empty page-error">{chartError}</p>
                  ) : (
                    <div className={`stats-chart${chartLoading ? ' is-loading' : ''}`}>
                      <div className="stats-chart__grid" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="stats-chart__bars" role="img" aria-label={`Hoạt động ${period} ngày gần nhất`}>
                        {daily.map((day, index) => {
                          const total = day.wordsLearned + day.wordsReviewed
                          const height = Math.max(total > 0 ? 4 : 0, (total / chart.max) * 100)
                          const label =
                            index % chart.labelStep === 0 || index === daily.length - 1
                          return (
                            <div
                              key={day.date}
                              className={`stats-bar${day.goalMet ? ' is-goal' : ''}`}
                              title={`${longDate(day.date)}: ${day.wordsLearned} từ mới, ${day.wordsReviewed} ôn, ${day.minutesStudied} phút`}
                            >
                              <span className="stats-bar__track">
                                <span
                                  className="stats-bar__fill"
                                  style={{ height: `${height}%` }}
                                >
                                  <span
                                    className="stats-bar__learned"
                                    style={{
                                      flexGrow: day.wordsLearned,
                                      flexBasis: day.wordsLearned > 0 ? 0 : '0%',
                                    }}
                                  />
                                  <span
                                    className="stats-bar__reviewed"
                                    style={{
                                      flexGrow: day.wordsReviewed,
                                      flexBasis: day.wordsReviewed > 0 ? 0 : '0%',
                                    }}
                                  />
                                </span>
                              </span>
                              <span className="stats-bar__label">
                                {label ? shortDate(day.date) : ''}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      {chartLoading ? (
                        <span className="stats-chart__spinner spinner spinner--page" aria-hidden="true" />
                      ) : null}
                    </div>
                  )}

                  {chart.totalWords === 0 && !chartLoading ? (
                    <p className="stats-chart-empty">
                      Chưa có lượt từ nào trong {period} ngày. Biểu đồ sẽ đầy lên sau
                      phiên học đầu tiên.
                    </p>
                  ) : null}
                  <p className="page-card__note">
                    Cột càng cao, ngày đó bạn chạm càng nhiều từ. Viền sáng đánh dấu
                    ngày đạt mục tiêu.
                  </p>
                </article>

                <article className="page-card stats-heatmap-card">
                  <div className="page-card__head">
                    <div>
                      <span className="page-card__eyebrow">Bản đồ nhiệt 90 ngày</span>
                      <h2>Những ngày bạn quay lại</h2>
                    </div>
                    <span className="page-card__note">{heatmap?.maxAnswers ?? 0} câu/ngày cao nhất</span>
                  </div>
                  <div className="stats-heatmap-scroll">
                    <div className="stats-heatmap">
                      {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="stats-heatmap__week">
                          {week.map((day, dayIndex) =>
                            day ? (
                              <span
                                key={day.date}
                                className={`stats-heatmap__cell level-${day.level}`}
                                title={`${longDate(day.date)}: ${day.answers} câu, ${day.minutes} phút`}
                              />
                            ) : (
                              <span key={`empty-${weekIndex}-${dayIndex}`} className="stats-heatmap__cell is-empty" />
                            ),
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="stats-heatmap__foot">
                    <span>Ít</span>
                    {[0, 1, 2, 3, 4].map((level) => (
                      <i key={level} className={`stats-heatmap__cell level-${level}`} />
                    ))}
                    <span>Nhiều</span>
                  </div>
                </article>
              </div>

              <div className="stats-col stats-col--side">
                <article className="page-card stats-skills-card">
                  <div className="page-card__head">
                    <div>
                      <span className="page-card__eyebrow">Hồ sơ năng lực</span>
                      <h2>Năm kỹ năng</h2>
                    </div>
                    <span className="page-card__note">/100</span>
                  </div>

                  <div className="stats-radar">
                    <svg viewBox="0 0 360 300" role="img" aria-label="Biểu đồ radar năm kỹ năng">
                      {[25, 50, 75, 100].map((level) => (
                        <polygon
                          key={level}
                          className="stats-radar__grid"
                          points={polygonPoints(
                            skills.map(() => level),
                            110,
                          )}
                        />
                      ))}
                      {skills.map((skill, index) => {
                        const point = radarPoint(index, skills.length, 100, 110)
                        return (
                          <line
                            key={skill.skillId}
                            className="stats-radar__axis"
                            x1="180"
                            y1="150"
                            x2={point.x}
                            y2={point.y}
                          />
                        )
                      })}
                      <polygon
                        className="stats-radar__area"
                        points={polygonPoints(skillValues, 110)}
                      />
                      {skills.map((skill, index) => {
                        const point = radarPoint(index, skills.length, Number(skill.score), 110)
                        return (
                          <circle
                            key={skill.skillId}
                            className="stats-radar__dot"
                            cx={point.x}
                            cy={point.y}
                            r="3.6"
                          />
                        )
                      })}
                      {skills.map((skill, index) => {
                        const angle = (-90 + (360 / skills.length) * index) * (Math.PI / 180)
                        const x = 180 + 134 * Math.cos(angle)
                        const y = 150 + 130 * Math.sin(angle)
                        const anchorX =
                          Math.abs(Math.cos(angle)) < 0.25
                            ? 'middle'
                            : Math.cos(angle) > 0
                              ? 'start'
                              : 'end'
                        return (
                          <text
                            key={skill.skillId}
                            className="stats-radar__label"
                            x={x}
                            y={y}
                            textAnchor={anchorX}
                            dominantBaseline="middle"
                          >
                            {skill.nameVi}
                          </text>
                        )
                      })}
                    </svg>
                  </div>

                  <div className="stats-skill-list">
                    {skills.map((skill) => (
                      <div key={skill.skillId} className="stats-skill">
                        <div className="stats-skill__head">
                          <span>{skill.nameVi}</span>
                          <strong>{Math.round(Number(skill.score))}</strong>
                        </div>
                        <span className="stats-skill__track">
                          <span
                            className="stats-skill__fill"
                            style={{ width: `${Math.min(100, Math.max(0, Number(skill.score)))}%` }}
                          />
                        </span>
                      </div>
                    ))}
                  </div>

                  {skillsBalanced ? (
                    <p className="stats-skill-balance">
                      <TargetIcon size={14} />
                      Năm kỹ năng đang cân bằng — làm thêm bài để tìm điểm mạnh.
                    </p>
                  ) : (
                    <div className="stats-skill-pair">
                      <span>
                        <TrophyIcon size={15} /> Mạnh nhất: <b>{strongest}</b>
                      </span>
                      <span>
                        <TargetIcon size={15} /> Cần cải thiện: <b>{weakest}</b>
                      </span>
                    </div>
                  )}
                  <p className="page-card__note">
                    {overview.totalAnswers === 0
                      ? 'Điểm khởi tạo 50 cho mỗi kỹ năng; sẽ thay đổi sau các phiên học thật.'
                      : 'Điểm ước tính, cập nhật sau mỗi phiên học.'}
                  </p>
                </article>

                <article className="page-card stats-sessions-card">
                  <div className="page-card__head">
                    <div>
                      <span className="page-card__eyebrow">Phiên gần đây</span>
                      <h2>Nhịp học của bạn</h2>
                    </div>
                    <Link to="/app/words" className="page-btn page-btn--icon" aria-label="Mở sổ từ">
                      <BookmarkIcon size={16} />
                    </Link>
                  </div>

                  {sessions.length > 0 ? (
                    <div className="stats-sessions">
                      {sessions.slice(0, 5).map((session) => {
                        const accuracy =
                          session.answered === 0
                            ? 0
                            : Math.round((session.correct / session.answered) * 100)
                        return (
                          <div key={session.id} className="stats-session">
                            <span className={`stats-session__icon ${session.mode === 'review' ? 'is-review' : ''}`}>
                              {session.mode === 'review' ? <PlayIcon size={15} /> : <SparkIcon size={15} />}
                            </span>
                            <div className="stats-session__copy">
                              <strong>{session.mode === 'review' ? 'Ôn tập' : 'Học từ mới'}</strong>
                              <span>
                                {sessionDate(session.startedAt)} · {session.answered} câu
                              </span>
                            </div>
                            <div className="stats-session__score">
                              <b>{accuracy}%</b>
                              <span>{session.correct}/{session.answered}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="stats-empty-note">
                      Chưa có phiên học nào. Mở sổ từ và bắt đầu ôn để thấy nhịp học
                      tại đây.
                    </p>
                  )}
                </article>
              </div>
            </section>

            <section className="stats-footnote">
              <span>
                <CheckIcon size={14} />
                Mọi con số lấy từ hoạt động thật, không phải dữ liệu mẫu.
              </span>
              <span>Cập nhật sau mỗi phiên học và mỗi từ được lưu.</span>
            </section>
          </>
        ) : null}
      </div>
    </AppScaffold>
  )
}
