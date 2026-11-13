import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Tabs } from '../components/ui/Tabs'
import {
  ChartIcon,
  CheckIcon,
  ClockIcon,
  FlameIcon,
  SparkIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  statsDailyRequest,
  statsHeatmapRequest,
  statsOverviewRequest,
  statsSkillsRequest,
  studySessionsRequest,
  type DailyStat,
  type Heatmap,
  type SkillScore,
  type StatsOverview,
  type StudySession,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/stats.css'

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayIso(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function StatsPage() {
  const { run } = useAuthedApi()
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [skills, setSkills] = useState<SkillScore[]>([])
  const [heatmap, setHeatmap] = useState<Heatmap | null>(null)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [daily, setDaily] = useState<DailyStat[]>([])
  const [range, setRange] = useState('14')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextOverview, nextSkills, nextHeat, nextSessions] = await Promise.all([
        run((token) => statsOverviewRequest(token)),
        run((token) => statsSkillsRequest(token)),
        run((token) => statsHeatmapRequest(token, 90)),
        run((token) => studySessionsRequest(token, 6)),
      ])
      setOverview(nextOverview)
      setSkills(nextSkills.skills)
      setHeatmap(nextHeat)
      setSessions(nextSessions)
      setDaily(nextOverview.last14Days)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa tải được thống kê.')
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (range === '14') {
      if (overview) setDaily(overview.last14Days)
      return
    }
    setChartLoading(true)
    run((token) => statsDailyRequest(token, isoDaysAgo(Number(range)), todayIso()))
      .then(setDaily)
      .catch(() => setDaily([]))
      .finally(() => setChartLoading(false))
  }, [overview, range, run])

  const maxDay = Math.max(1, ...daily.map((day) => day.wordsLearned + day.wordsReviewed))
  const totalWords = overview?.totalWords ?? 0
  const measured = (overview?.totalAnswers ?? 0) > 0
  const strongest = useMemo(
    () => [...skills].sort((a, b) => b.score - a.score)[0] ?? null,
    [skills],
  )

  return (
    <div className="stats">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><ChartIcon size={14} /> Thống kê</span>
          <h1>Tiến bộ của bạn</h1>
          <p>Nhìn lại từ đã học, chuỗi ngày, độ chính xác và nhịp học.</p>
        </div>
        <div className="page-head__actions">
          <Link to="/app/vocabulary" className="btn btn--sec btn--sm">Mở sổ từ</Link>
          <Link to="/app/practice" className="btn btn--sm"><SparkIcon size={15} /> Luyện thêm</Link>
        </div>
      </header>

      {error ? <FeedbackBar tone="bad" action={<Button size="sm" variant="secondary" onClick={load}>Thử lại</Button>}>{error}</FeedbackBar> : null}

      <div className="metric-row">
        <Metric icon={<TrophyIcon size={15} />} label="Từ đã học" value={totalWords} hint={`${overview?.masteredWords ?? 0} đã thuộc`} />
        <Metric icon={<FlameIcon size={15} />} label="Chuỗi ngày" value={overview?.streakDays ?? 0} hint="liên tiếp" />
        <Metric icon={<CheckIcon size={15} />} label="Độ chính xác" value={`${Math.round(overview?.accuracyPct ?? 0)}%`} hint={`${overview?.totalAnswers ?? 0} câu`} />
        <Metric icon={<ClockIcon size={15} />} label="Thời gian học" value={overview?.totalStudyMinutes ?? 0} hint="phút" />
      </div>

      <div className="stats__grid">
        <Card className="stats-chart">
          <div className="card__head">
            <div>
              <span className="card__eyebrow">Nhịp học</span>
              <h2 className="card__title">Từ mới & ôn lại</h2>
            </div>
            <Tabs
              items={[
                { id: '14', label: '14 ngày' },
                { id: '30', label: '30 ngày' },
                { id: '90', label: '90 ngày' },
              ]}
              value={range}
              onChange={setRange}
              ariaLabel="Khoảng thời gian biểu đồ"
            />
          </div>
          {chartLoading ? (
            <div className="skeleton" style={{ height: 180 }} />
          ) : daily.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>
              <h3>Chưa có dữ liệu</h3>
              <p>Học vài từ để biểu đồ bắt đầu vẽ.</p>
            </div>
          ) : (
            <>
              <div className="stats-bars" role="img" aria-label="Số từ học và ôn theo ngày">
                {daily.map((day) => {
                  const learned = day.wordsLearned
                  const reviewed = day.wordsReviewed
                  const total = learned + reviewed
                  const height = Math.max(3, Math.round((total / maxDay) * 100))
                  return (
                    <div key={day.date} className="stats-bars__col" title={`${day.date}: ${learned} mới, ${reviewed} ôn`}>
                      <span>{total > 0 ? total : ''}</span>
                      <div className="stats-bars__track">
                        <i style={{ height: `${height}%` }}>
                          <b style={{ height: `${total === 0 ? 0 : (learned / total) * 100}%` }} />
                        </i>
                      </div>
                      <em>{day.date.slice(8)}</em>
                    </div>
                  )
                })}
              </div>
              <div className="stats-legend">
                <span><i className="is-new" /> Từ mới</span>
                <span><i className="is-review" /> Ôn lại</span>
              </div>
            </>
          )}
        </Card>

        <Card className="stats-skills">
          <div className="card__head">
            <div>
              <span className="card__eyebrow">Hồ sơ năng lực</span>
              <h2 className="card__title">5 kỹ năng</h2>
            </div>
            {strongest ? <Chip tone="ok">{strongest.nameVi} mạnh nhất</Chip> : null}
          </div>
          <div className="stats-skill-list">
            {skills.map((skill) => (
              <div key={skill.skillId} className="stats-skill">
                <div>
                  <span>{skill.nameVi}</span>
                  <strong>{Math.round(skill.score)}</strong>
                </div>
                <div className="progress progress--slim">
                  <i style={{ width: `${Math.min(100, Math.max(0, skill.score))}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="stats-note">
            Điểm ước tính từ bài luyện, cập nhật sau mỗi phiên. Điểm khởi tạo là 50.
          </p>
        </Card>
      </div>

      <div className="stats__grid stats__grid--second">
        <Card>
          <div className="card__head">
            <div>
              <span className="card__eyebrow">90 ngày</span>
              <h2 className="card__title">Bản đồ nhiệt</h2>
            </div>
            <span className="stats-note">{heatmap?.maxAnswers ?? 0} câu/ngày cao nhất</span>
          </div>
          {heatmap ? (
            <>
              <div className="heatmap" aria-label="Bản đồ nhiệt học tập 90 ngày">
                {heatmap.data.map((day) => (
                  <span
                    key={day.date}
                    className={`heatmap__cell level-${day.level}`}
                    title={`${day.date}: ${day.answers} câu · ${day.minutes} phút`}
                  />
                ))}
              </div>
              <div className="heatmap__legend">
                <span>Ít</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <i key={level} className={`level-${level}`} />
                ))}
                <span>Nhiều</span>
              </div>
            </>
          ) : (
            <div className="skeleton" style={{ height: 90 }} />
          )}
        </Card>

        <Card>
          <div className="card__head">
            <div>
              <span className="card__eyebrow">Gần đây</span>
              <h2 className="card__title">Phiên học</h2>
            </div>
            <ClockIcon size={17} />
          </div>
          {sessions.length === 0 ? (
            <p className="stats-note">Chưa có phiên học nào. Bắt đầu một phiên 5 phút nhé.</p>
          ) : (
            <div className="stats-sessions">
              {sessions.map((session) => (
                <div key={session.id}>
                  <span>
                    {session.mode === 'review' ? 'Ôn tập' : 'Học mới'}
                    <em>{new Date(session.startedAt).toLocaleDateString('vi-VN')}</em>
                  </span>
                  <strong>{session.answered} câu · {session.correct} đúng</strong>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {!loading && !measured ? (
        <Card flat className="stats-empty">
          <SparkIcon size={18} />
          <p>
            Dữ liệu thống kê sẽ dày lên sau mỗi phiên học. Hôm nay thử 5 từ mới
            hoặc ôn các từ đến hạn nhé.
          </p>
        </Card>
      ) : null}
    </div>
  )
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string | number; hint: string }) {
  return (
    <div className="metric">
      <span>{icon} {label}</span>
      <strong>{value}</strong>
      <em>{hint}</em>
    </div>
  )
}
