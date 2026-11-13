import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  ArrowRightIcon,
  BookIcon,
  ChartIcon,
  CheckIcon,
  ChatIcon,
  ClockIcon,
  LockIcon,
  PlayIcon,
  SearchIcon,
  SparkIcon,
  TargetIcon,
} from '../components/Icons'
import { CloudBuddy } from '../components/mascot/CloudBuddy'
import {
  ApiError,
  generatePlanRequest,
  plansRequest,
  type LearningPlan,
} from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { useAuthedApi } from '../lib/useAuthedApi'
import { buildProgram } from '../lib/personalization'
import { useAppData } from '../components/layout/AppLayout'
import {
  ALL_LEVELS,
  COURSE_UNITS,
  EXERCISE_LABEL,
  exerciseKinds,
  levelIndex,
  unitOfLevel,
} from '../lib/curriculum'
import {
  courseSummary,
  firstOpenLevel,
  isLevelDone,
  isLevelUnlocked,
  useCourseProgress,
} from '../lib/courseProgress'
import '../styles/learn.css'
import '../styles/course.css'

export function LearnPage() {
  const { dashboard, loading, error, reload } = useAppData()
  const { run } = useAuthedApi()
  const { user } = useAuth()
  const { progress } = useCourseProgress(user?.email)
  const [plans, setPlans] = useState<LearningPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [notice, setNotice] = useState('')

  const program = buildProgram(user?.levelCode, user?.levelName, user?.learningPurpose)
  const summary = courseSummary(progress)
  const openIndex = firstOpenLevel(progress)
  const openLevel = ALL_LEVELS[openIndex] ?? ALL_LEVELS[0]
  const openUnit = unitOfLevel(openLevel)
  const allDone = summary.done >= summary.total

  const loadPlans = useCallback(() => {
    setPlansLoading(true)
    run((token) => plansRequest(token))
      .then((data) => setPlans(data))
      .catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 401) return
        setNotice(caught instanceof Error ? caught.message : 'Chưa tải được lộ trình.')
      })
      .finally(() => setPlansLoading(false))
  }, [run])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const activePlan = plans.find((plan) => plan.status === 'active') ?? plans[0] ?? null

  async function handleGenerate() {
    setGenerating(true)
    setNotice('')
    try {
      await run((token) =>
        generatePlanRequest(token, {
          days: program.days,
          minutesPerDay: program.minutes,
          focusSkill: program.focusSkill || null,
        }),
      )
      setNotice('Đã tạo lộ trình mới theo trình độ và mục tiêu của bạn.')
      loadPlans()
      reload()
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Chưa tạo được lộ trình.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="learn">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow">
            <SparkIcon size={14} /> Khóa học Nimbus
          </span>
          <h1>Chào {user?.displayName?.split(' ').slice(-1)[0] ?? 'bạn'}, hôm nay chơi level nào?</h1>
          <p>
            {program.levelLabel} · {summary.done}/{summary.total} level · {summary.xp} XP
          </p>
        </div>
        <div className="page-head__actions">
          <Link to="/app/review" className="btn btn--sec btn--sm">
            <ClockIcon size={15} /> Ôn tập
          </Link>
          <Link to={`/app/lesson/${openLevel.id}`} className="btn btn--sm">
            <PlayIcon size={15} /> {allDone ? 'Ôn level cuối' : 'Học tiếp'}
          </Link>
        </div>
      </header>

      {error ? (
        <Card flat className="learn__alert">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={reload}>Thử lại</Button>
        </Card>
      ) : null}

      <Card className="course-hero">
        <div className="course-hero__copy">
          <Chip tone="gold" icon={<TargetIcon size={12} />}>
            {openUnit ? `Unit ${COURSE_UNITS.findIndex((unit) => unit.id === openUnit.id) + 1} · ${openUnit.cefr}` : '12 level'}
          </Chip>
          <h2>Học từng level, mở từng nấc thang</h2>
          <p>
            Mỗi level có 5 dạng bài: trắc nghiệm, ghép cặp, xếp câu, nghe chép và điền từ.
            Hoàn thành để mở level kế tiếp cùng Nimbo và các bạn mây.
          </p>
          <div className="course-hero__stats">
            <span><strong>{summary.done}</strong>/{summary.total} level</span>
            <span><strong>{summary.xp}</strong> XP</span>
            <span><strong>{summary.stars}</strong>/{summary.maxStars} sao</span>
          </div>
          <div className="course-hero__actions">
            <Link to={`/app/lesson/${openLevel.id}`} className="btn">
              {allDone ? 'Ôn lại level cuối' : `Học level ${openIndex + 1}`} <ArrowRightIcon size={15} />
            </Link>
            <Link to="/app/practice" className="btn btn--sec">Luyện tự do</Link>
          </div>
        </div>
        <div className="course-hero__art">
          <div className="course-hero__buddies" aria-hidden="true">
            <CloudBuddy friend="lumi" size={78} pose="idle" />
            <CloudBuddy friend="nimbo" size={112} pose="cheer" />
            <CloudBuddy friend="pip" size={78} pose="idle" />
          </div>
          <div className="course-hero__bubble">
            <SparkIcon size={14} />
            <p>
              {allDone
                ? 'Bạn đã đi hết 12 level. Ôn lại để giữ phong độ nhé!'
                : `${openLevel.title} đang chờ bạn. Chỉ cần 5 phút thôi!`}
            </p>
          </div>
        </div>
      </Card>

      <section className="course-map">
        <div className="section-head">
          <div>
            <h2>Bản đồ khóa học</h2>
            <p>Đi lần lượt từng level. Level đã xong có thể chơi lại để lấy trọn 3 sao.</p>
          </div>
          <Chip tone="ok">{summary.done}/{summary.total} đã xong</Chip>
        </div>

        {COURSE_UNITS.map((unit, unitPosition) => {
          const unitDone = unit.levels.filter((level) => isLevelDone(progress, level.id)).length
          const isOpenUnit = openUnit?.id === unit.id
          const firstOpenInUnit =
            unit.levels.find((level) => {
              const flat = levelIndex(level.id)
              return !isLevelDone(progress, level.id) && isLevelUnlocked(progress, flat)
            }) ?? unit.levels[0]
          return (
            <section className={`course-unit${isOpenUnit ? ' is-active' : ''}`} key={unit.id}>
              <header className="course-unit__head">
                <div className="course-unit__copy">
                  <span className="course-unit__eyebrow">
                    Unit {unitPosition + 1} · {unit.cefr}
                  </span>
                  <h3>{unit.title}</h3>
                  <p>{unit.description}</p>
                </div>
                <div className="course-unit__side">
                  <span>{unitDone}/{unit.levels.length} level</span>
                  {isOpenUnit ? (
                    <Link to={`/app/lesson/${firstOpenInUnit.id}`} className="btn btn--sm">
                      HỌC
                    </Link>
                  ) : (
                    <span className={`course-unit__state${unitDone === unit.levels.length ? ' is-done' : ''}`}>
                      {unitDone === unit.levels.length ? 'Hoàn thành' : 'Đang chờ'}
                    </span>
                  )}
                </div>
              </header>

              <div className="course-unit__track">
                <span className="course-unit__line" aria-hidden="true" />
                {unit.levels.map((level, localPosition) => {
                  const flat = levelIndex(level.id)
                  const done = isLevelDone(progress, level.id)
                  const unlocked = isLevelUnlocked(progress, flat)
                  const current = flat === openIndex && !allDone
                  const stars = progress.levels[level.id]?.stars ?? 0
                  const kinds = exerciseKinds(level)
                  return (
                    <div
                      className={`course-node pos-${localPosition % 4}${done ? ' is-done' : ''}${
                        unlocked ? '' : ' is-locked'
                      }${current ? ' is-current' : ''}`}
                      key={level.id}
                    >
                      <div className="course-node__bubble-wrap">
                        {current ? <span className="course-node__start">BẮT ĐẦU</span> : null}
                        <Link
                          to={unlocked ? `/app/lesson/${level.id}` : '/app'}
                          className="course-node__bubble"
                          aria-disabled={!unlocked}
                          aria-label={`${level.title} — ${
                            done ? `đã hoàn thành ${stars} sao` : unlocked ? 'sẵn sàng học' : 'đang khóa'
                          }`}
                          onClick={(event) => {
                            if (!unlocked) event.preventDefault()
                          }}
                        >
                          {done ? <CheckIcon size={24} /> : unlocked ? <span>{String(flat + 1).padStart(2, '0')}</span> : <LockIcon size={20} />}
                        </Link>
                        {done ? (
                          <span className="course-node__stars" aria-label={`${stars} trên 3 sao`}>
                            {[0, 1, 2].map((star) => (
                              <i key={star} className={star < stars ? 'on' : ''}>★</i>
                            ))}
                          </span>
                        ) : null}
                      </div>
                      <div className="course-node__copy">
                        <strong>{level.title}</strong>
                        <span>{level.subtitle}</span>
                        <div className="course-node__meta">
                          {unlocked ? (
                            <>
                              <span>{level.exercises.length} câu · {level.xp} XP</span>
                              <span className="course-node__dots" aria-label={`${kinds.length} dạng bài`}>
                                {kinds.map((kind) => (
                                  <i key={kind} title={EXERCISE_LABEL[kind]} />
                                ))}
                              </span>
                            </>
                          ) : (
                            <span>Hoàn thành level trước</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </section>

      <Card className="learn-plan-card">
        <div className="learn-plan-card__copy">
          <span className="card__eyebrow">Lộ trình cá nhân</span>
          <h2>{activePlan ? `${activePlan.doneTasks}/${activePlan.totalTasks} nhiệm vụ` : 'Thêm một lộ trình riêng'}</h2>
          <p>
            {activePlan
              ? `Theo mục tiêu ${program.purposeLabel} · ${program.minutes} phút/ngày.`
              : `Tạo lộ trình ${program.days} ngày để Nimbo chia nhỏ việc học theo mục tiêu ${program.purposeLabel}.`}
          </p>
        </div>
        {activePlan ? (
          <div className="learn-plan-card__progress">
            <ProgressBar
              value={activePlan.doneTasks}
              max={Math.max(1, activePlan.totalTasks)}
              label="Tiến độ lộ trình cá nhân"
            />
            <Link to="/app/practice" className="btn btn--sec btn--sm">Làm nhiệm vụ</Link>
          </div>
        ) : (
          <Button size="sm" onClick={handleGenerate} disabled={generating || plansLoading}>
            {generating ? <span className="spinner" /> : <SparkIcon size={15} />}
            {generating ? 'Đang tạo...' : 'Tạo lộ trình'}
          </Button>
        )}
      </Card>

      {notice ? <p className="learn-notice">{notice}</p> : null}

      <section>
        <div className="section-head">
          <div>
            <h2>Góc luyện thêm</h2>
            <p>Khi đã xong level hôm nay, ghé các phòng này nhé.</p>
          </div>
        </div>
        <div className="learn-quick">
          <QuickCard to="/app/review" icon={<ClockIcon size={20} />} title="Ôn tập đến hạn" hint={`${dashboard?.dueCount ?? 0} từ đang chờ`} />
          <QuickCard to="/app/practice" icon={<TargetIcon size={20} />} title="Luyện tập tự do" hint="Trắc nghiệm, điền từ, nghe" />
          <QuickCard to="/app/reading" icon={<BookIcon size={20} />} title="Bài đọc" hint="Đọc hiểu, lưu từ mới" />
          <QuickCard to="/app/chat" icon={<ChatIcon size={20} />} title="Trò chuyện cùng AI" hint="Đóng vai tình huống thật" />
          <QuickCard to="/app/dictionary" icon={<SearchIcon size={20} />} title="Tra từ theo ngữ cảnh" hint="Dán câu, chọn từ cần hiểu" />
          <QuickCard to="/app/stats" icon={<ChartIcon size={20} />} title="Xem tiến độ" hint="Streak, kỹ năng, biểu đồ" />
        </div>
      </section>

      {loading && !dashboard ? (
        <Card flat><div className="skeleton" style={{ height: 80 }} /></Card>
      ) : null}
    </div>
  )
}

function QuickCard({ to, icon, title, hint }: { to: string; icon: ReactNode; title: string; hint: string }) {
  return (
    <Link to={to} className="learn-quick__item">
      <span className="learn-quick__icon">{icon}</span>
      <strong>{title}</strong>
      <span>{hint}</span>
      <ArrowRightIcon size={15} className="learn-quick__arrow" />
    </Link>
  )
}
