import {
  type ComponentType,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { AppScaffold } from '../components/AppScaffold'
import {
  BookIcon,
  BookmarkIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  EditIcon,
  MicIcon,
  PlusIcon,
  SparkIcon,
  SpeakerIcon,
  TargetIcon,
  TrashIcon,
  TrendingIcon,
} from '../components/Icons'
import {
  ApiError,
  addPlanTaskRequest,
  completePlanTaskRequest,
  deletePlanRequest,
  generatePlanRequest,
  plansRequest,
  skillsRequest,
  type LearningPlan,
  type PlanTask,
  type SkillRef,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import { useAuth } from '../lib/AuthContext'
import { buildProgram, focusSkillFor } from '../lib/personalization'
import '../styles/plan.css'

type IconType = ComponentType<{ size?: number; className?: string }>
type TaskTab = 'todo' | 'upcoming' | 'done' | 'all'
type Notice = { tone: 'ok' | 'error'; text: string }

const SKILL_ICONS: Record<string, IconType> = {
  vocabulary: BookmarkIcon,
  listening: SpeakerIcon,
  speaking: MicIcon,
  reading: BookIcon,
  grammar: EditIcon,
}

const STATUS_TEXT: Record<string, string> = {
  active: 'Đang chạy',
  done: 'Hoàn thành',
  cancelled: 'Đã thay thế',
}

const TASK_TABS: { value: TaskTab; label: string }[] = [
  { value: 'todo', label: 'Cần làm' },
  { value: 'upcoming', label: 'Sắp tới' },
  { value: 'done', label: 'Đã xong' },
  { value: 'all', label: 'Tất cả' },
]

const DAY_PRESETS = [7, 14, 30, 60]
const MINUTE_PRESETS = [10, 20, 30, 45]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function parseDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function daysBetween(from: string, to: string): number {
  const a = parseDay(from)
  const b = parseDay(to)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function formatShort(value: string): string {
  const date = parseDay(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getDate()}/${date.getMonth() + 1}`
}

function formatLong(value: string): string {
  const date = parseDay(value)
  if (Number.isNaN(date.getTime())) return value
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date)
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date.getDate()}/${date.getMonth() + 1}`
}

function relativeDay(value: string, today: string): string {
  const diff = daysBetween(today, value)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Ngày mai'
  if (diff === -1) return 'Hôm qua'
  if (diff < 0) return `Trễ ${Math.abs(diff)} ngày`
  return `Còn ${diff} ngày`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function skillIcon(code: string): IconType {
  return SKILL_ICONS[code] ?? SparkIcon
}

export function PlanPage() {
  const { run } = useAuthedApi()
  const { user } = useAuth()

  const program = buildProgram(
    user?.levelCode,
    user?.levelName,
    user?.learningPurpose,
  )

  const [plans, setPlans] = useState<LearningPlan[]>([])
  const [skills, setSkills] = useState<SkillRef[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const [tab, setTab] = useState<TaskTab>('todo')
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [taskError, setTaskError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [days, setDays] = useState(() => program.days)
  const [minutes, setMinutes] = useState(() => program.minutes)
  const [focus, setFocus] = useState(() => focusSkillFor(user?.learningPurpose))
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskSkillId, setTaskSkillId] = useState<number | null>(null)
  const [taskDue, setTaskDue] = useState(todayIso())
  const [addingTask, setAddingTask] = useState(false)
  const [addTaskError, setAddTaskError] = useState('')

  const today = todayIso()

  const loadPlans = useCallback(
    async (preferredId?: number | null) => {
      setLoading(true)
      setError('')
      try {
        const [nextPlans, nextSkills] = await Promise.all([
          run((token) => plansRequest(token)),
          run((token) => skillsRequest(token)),
        ])
        setPlans(nextPlans)
        setSkills(nextSkills)
        setSelectedId((current) => {
          const wanted = preferredId ?? current
          if (wanted && nextPlans.some((plan) => plan.id === wanted)) return wanted
          return (
            nextPlans.find((plan) => plan.status === 'active')?.id ??
            nextPlans[0]?.id ??
            null
          )
        })
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) return
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Chưa tải được lộ trình. Vui lòng thử lại.',
        )
      } finally {
        setLoading(false)
      }
    },
    [run],
  )

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const selected = useMemo(
    () => plans.find((plan) => plan.id === selectedId) ?? null,
    [plans, selectedId],
  )

  const activePlan = plans.find((plan) => plan.status === 'active') ?? null

  const taskCounts = useMemo(() => {
    const tasks = selected?.tasks ?? []
    return {
      todo: tasks.filter((task) => !task.isDone && task.dueDate <= today).length,
      upcoming: tasks.filter((task) => !task.isDone && task.dueDate > today).length,
      done: tasks.filter((task) => task.isDone).length,
      all: tasks.length,
    }
  }, [selected, today])

  const groups = useMemo(() => {
    if (!selected) return [] as { date: string; tasks: PlanTask[]; done: number }[]
    const visible = selected.tasks.filter((task) => {
      if (tab === 'todo') return !task.isDone && task.dueDate <= today
      if (tab === 'upcoming') return !task.isDone && task.dueDate > today
      if (tab === 'done') return task.isDone
      return true
    })
    const sorted = [...visible].sort((a, b) =>
      tab === 'done'
        ? b.dueDate.localeCompare(a.dueDate)
        : a.dueDate.localeCompare(b.dueDate) || a.id - b.id,
    )
    const map = new Map<string, PlanTask[]>()
    for (const task of sorted) {
      const list = map.get(task.dueDate)
      if (list) list.push(task)
      else map.set(task.dueDate, [task])
    }
    return [...map.entries()].map(([date, tasks]) => ({
      date,
      tasks,
      done: tasks.filter((task) => task.isDone).length,
    }))
  }, [selected, tab, today])

  const breakdown = useMemo(() => {
    if (!selected) return [] as { code: string; name: string; total: number; done: number }[]
    const map = new Map<string, { code: string; name: string; total: number; done: number }>()
    for (const task of selected.tasks) {
      const current = map.get(task.skillCode)
      if (current) {
        current.total += 1
        if (task.isDone) current.done += 1
      } else {
        map.set(task.skillCode, {
          code: task.skillCode,
          name: task.skillNameVi,
          total: 1,
          done: task.isDone ? 1 : 0,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [selected])

  const progress = selected
    ? selected.totalTasks === 0
      ? 0
      : Math.round((selected.doneTasks / selected.totalTasks) * 100)
    : 0

  const totalDays = selected ? Math.max(1, daysBetween(selected.startDate, selected.endDate) + 1) : 0
  const elapsed = selected
    ? clamp(daysBetween(selected.startDate, today) + 1, 0, totalDays)
    : 0
  const remaining = selected ? daysBetween(today, selected.endDate) : 0
  const dayCopy = !selected
    ? ''
    : selected.status === 'done'
      ? 'Bạn đã hoàn thành toàn bộ lộ trình này.'
      : selected.status === 'cancelled'
        ? 'Lộ trình này đã được thay thế bởi một lộ trình mới.'
        : remaining < 0
          ? `Đã qua ngày kết thúc ${Math.abs(remaining)} ngày.`
          : remaining === 0
            ? 'Hôm nay là ngày cuối của lộ trình.'
            : `Còn ${remaining} ngày · đang ở ngày ${elapsed}/${totalDays}`

  const addDueDefault = selected
    ? today < selected.startDate
      ? selected.startDate
      : today > selected.endDate
        ? selected.endDate
        : today
    : today

  /* ---------- Hành động ---------- */

  function openGenerator() {
    setGenerateError('')
    setGeneratorOpen(true)
    setAddOpen(false)
  }

  async function submitGenerate(event: FormEvent) {
    event.preventDefault()
    setGenerating(true)
    setGenerateError('')
    try {
      const created = await run((token) =>
        generatePlanRequest(token, {
          days: clamp(days, 3, 90),
          minutesPerDay: clamp(minutes, 5, 120),
          focusSkill: focus || null,
        }),
      )
      setGeneratorOpen(false)
      setNotice({
        tone: 'ok',
        text: `Đã tạo lộ trình ${days} ngày với ${created.totalTasks} nhiệm vụ.`,
      })
      setTab('todo')
      await loadPlans(created.id)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setGenerateError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa tạo được lộ trình. Vui lòng thử lại.',
      )
    } finally {
      setGenerating(false)
    }
  }

  async function toggleTask(task: PlanTask) {
    if (!selected || togglingId !== null || selected.status === 'cancelled') return
    setTogglingId(task.id)
    setTaskError('')
    try {
      const updated = await run((token) =>
        completePlanTaskRequest(token, selected.id, task.id, !task.isDone),
      )
      setPlans((list) =>
        list.map((plan) => {
          if (plan.id !== selected.id) return plan
          const tasks = plan.tasks.map((item) =>
            item.id === updated.id ? updated : item,
          )
          const doneTasks = tasks.filter((item) => item.isDone).length
          const allDone = tasks.length > 0 && doneTasks === tasks.length
          return {
            ...plan,
            tasks,
            doneTasks,
            status:
              plan.status === 'cancelled'
                ? 'cancelled'
                : allDone
                  ? 'done'
                  : 'active',
          }
        }),
      )
      setNotice({
        tone: 'ok',
        text: updated.isDone
          ? `Đã hoàn thành “${updated.title}”.`
          : `Đã mở lại “${updated.title}”.`,
      })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setTaskError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa cập nhật được nhiệm vụ.',
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function submitTask(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    const title = taskTitle.trim()
    if (title.length < 3) {
      setAddTaskError('Tên nhiệm vụ cần ít nhất 3 ký tự.')
      return
    }
    if (!taskSkillId) {
      setAddTaskError('Chọn một kỹ năng cho nhiệm vụ.')
      return
    }
    if (!taskDue) {
      setAddTaskError('Chọn ngày cho nhiệm vụ.')
      return
    }
    setAddingTask(true)
    setAddTaskError('')
    try {
      await run((token) =>
        addPlanTaskRequest(token, selected.id, {
          skillId: taskSkillId,
          title,
          dueDate: taskDue,
        }),
      )
      setTaskTitle('')
      setAddOpen(false)
      setNotice({ tone: 'ok', text: `Đã thêm nhiệm vụ “${title}”.` })
      await loadPlans(selected.id)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setAddTaskError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa thêm được nhiệm vụ.',
      )
    } finally {
      setAddingTask(false)
    }
  }

  async function deleteSelected() {
    if (!selected) return
    setDeleting(true)
    try {
      await run((token) => deletePlanRequest(token, selected.id))
      setConfirmDelete(false)
      setNotice({ tone: 'ok', text: 'Đã xóa lộ trình.' })
      await loadPlans()
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setNotice({
        tone: 'error',
        text: caught instanceof ApiError ? caught.message : 'Chưa xóa được lộ trình.',
      })
    } finally {
      setDeleting(false)
    }
  }

  function openAddTask() {
    setAddTaskError('')
    setTaskDue(addDueDefault)
    setTaskSkillId((current) => current ?? skills[0]?.id ?? null)
    setAddOpen(true)
  }

  /* ---------- Giao diện ---------- */

  return (
    <AppScaffold className="plan-page">
      <section className="page-hero site-shell">
        <div className="page-hero__copy">
          <span className="page-eyebrow">
            <CalendarIcon size={14} />
            Lộ trình cá nhân hóa
          </span>
          <h1>
            Mỗi ngày một bước,
            <br />
            <em>đúng việc cần làm.</em>
          </h1>
          <p>
            Lộ trình chia mục tiêu thành nhiệm vụ theo ngày, dựa trên trình độ,
            mục tiêu từ vựng và điểm kỹ năng thật của bạn. Xong từng việc nhỏ,
            tiến bộ lớn dần.
          </p>
        </div>
        <div className="page-hero__actions">
          <button
            type="button"
            className="page-btn page-btn--primary"
            onClick={openGenerator}
          >
            <PlusIcon size={16} />
            {activePlan ? 'Tạo lộ trình mới' : 'Tạo lộ trình'}
          </button>
          <Link to="/app/words" className="page-btn">
            <BookmarkIcon size={16} />
            Mở sổ từ
          </Link>
        </div>
      </section>

      <div className="site-shell">
        {notice ? (
          <div
            className={`plan-notice is-${notice.tone}`}
            role="status"
            aria-live="polite"
          >
            {notice.tone === 'ok' ? <CheckIcon size={15} /> : <CloseIcon size={15} />}
            <span>{notice.text}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setNotice(null)}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ) : null}

        {generatorOpen ? (
          <section className="page-card plan-generator">
            <div className="plan-generator__copy">
              <span className="page-card__eyebrow">
                <SparkIcon size={12} /> Trình lập kế hoạch
              </span>
              <h2>Tạo lộ trình vừa sức</h2>
              <p>
                Chọn số ngày, thời gian mỗi ngày và kỹ năng muốn ưu tiên. Lộ
                trình sẽ chia việc theo từng ngày, bám mục tiêu từ vựng và điểm
                kỹ năng hiện tại.
              </p>
              <ul className="plan-generator__points">
                <li>
                  <CalendarIcon size={14} />
                  Nhiệm vụ trải đều 3–90 ngày
                </li>
                <li>
                  <TargetIcon size={14} />
                  Ưu tiên kỹ năng bạn chọn
                </li>
                <li>
                  <CheckIcon size={14} />
                  Đánh dấu xong để theo dõi tiến độ
                </li>
              </ul>
              {activePlan ? (
                <p className="plan-generator__warn">
                  <TrendingIcon size={14} />
                  Lộ trình đang chạy sẽ được thay thế bằng lộ trình mới.
                </p>
              ) : null}
            </div>

            <form className="plan-generator__form" onSubmit={submitGenerate}>
              {program.hasPurpose ? (
                <p className="plan-generator__persona">
                  <SparkIcon size={14} />
                  Đã chọn sẵn theo mục tiêu <b>{program.purposeLabel}</b> — {program.title}
                </p>
              ) : null}

              <div className="plan-generator__field">
                <div className="plan-generator__label">
                  <label htmlFor="plan-days">Số ngày</label>
                  <b>{days} ngày</b>
                </div>
                <input
                  id="plan-days"
                  type="range"
                  min={3}
                  max={90}
                  step={1}
                  value={days}
                  onChange={(event) =>
                    setDays(clamp(Number(event.target.value), 3, 90))
                  }
                />
                <div className="plan-generator__presets">
                  {DAY_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`plan-preset${days === value ? ' is-active' : ''}`}
                      onClick={() => setDays(value)}
                    >
                      {value} ngày
                    </button>
                  ))}
                </div>
              </div>

              <div className="plan-generator__field">
                <div className="plan-generator__label">
                  <label htmlFor="plan-minutes">Thời gian mỗi ngày</label>
                  <b>{minutes} phút</b>
                </div>
                <input
                  id="plan-minutes"
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={minutes}
                  onChange={(event) =>
                    setMinutes(clamp(Number(event.target.value), 5, 120))
                  }
                />
                <div className="plan-generator__presets">
                  {MINUTE_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`plan-preset${minutes === value ? ' is-active' : ''}`}
                      onClick={() => setMinutes(value)}
                    >
                      {value} phút
                    </button>
                  ))}
                </div>
              </div>

              <label className="plan-generator__field plan-generator__field--select">
                <span className="plan-generator__label">
                  <label htmlFor="plan-focus">Kỹ năng ưu tiên</label>
                </span>
                <select
                  id="plan-focus"
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                >
                  <option value="">Cân bằng 5 kỹ năng</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.code}>
                      {skill.nameVi}
                    </option>
                  ))}
                </select>
              </label>

              {generateError ? (
                <p className="plan-alert" role="alert">
                  {generateError}
                </p>
              ) : null}

              <div className="plan-generator__actions">
                <button
                  type="submit"
                  className="page-btn page-btn--primary"
                  disabled={generating}
                >
                  {generating ? (
                    <span className="spinner" aria-hidden="true" />
                  ) : (
                    <SparkIcon size={15} />
                  )}
                  {generating ? 'Đang tạo...' : `Tạo lộ trình ${days} ngày`}
                </button>
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => {
                    setGeneratorOpen(false)
                    setGenerateError('')
                  }}
                  disabled={generating}
                >
                  Hủy
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {loading ? (
          <div className="page-state" aria-live="polite">
            <span className="spinner spinner--page" aria-hidden="true" />
            <p>Đang dựng lộ trình của bạn...</p>
          </div>
        ) : error ? (
          <div className="page-state" role="alert">
            <span className="page-state__icon">
              <CalendarIcon size={22} />
            </span>
            <h2>Chưa tải được lộ trình</h2>
            <p className="page-error">{error}</p>
            <div className="page-state__actions">
              <button
                type="button"
                className="page-btn page-btn--primary"
                onClick={() => void loadPlans()}
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <section className="page-card plan-empty">
            <span className="plan-empty__icon">
              <CalendarIcon size={28} />
            </span>
            <h2>Chưa có lộ trình nào</h2>
            <p>
              Tạo lộ trình 7, 14 hoặc 30 ngày để biết mỗi ngày nên học gì. Mọi
              nhiệm vụ đều dựa trên trình độ và mục tiêu thật của bạn, không
              phải kế hoạch mẫu.
            </p>
            <div className="plan-empty__points">
              <div>
                <span>
                  <CalendarIcon size={17} />
                </span>
                <strong>Chia việc theo ngày</strong>
                <p>Mỗi ngày một vài nhiệm vụ ngắn, vừa sức.</p>
              </div>
              <div>
                <span>
                  <TargetIcon size={17} />
                </span>
                <strong>Bám kỹ năng yếu</strong>
                <p>Ưu tiên đúng kỹ năng bạn chọn.</p>
              </div>
              <div>
                <span>
                  <CheckIcon size={17} />
                </span>
                <strong>Theo dõi tiến độ</strong>
                <p>Đánh dấu xong và nhìn lộ trình lớn dần.</p>
              </div>
            </div>
            <button
              type="button"
              className="page-btn page-btn--primary"
              onClick={openGenerator}
            >
              <PlusIcon size={16} />
              Tạo lộ trình đầu tiên
            </button>
            <p className="plan-empty__links">
              Chưa có từ để học?{' '}
              <Link to="/app/context">Tra từ theo ngữ cảnh</Link> rồi lưu vào sổ.
            </p>
          </section>
        ) : selected ? (
          <>
            <section className={`plan-overview${selected.status !== 'active' ? ' is-muted' : ''}`}>
              <article className={`page-card plan-progress-card is-${selected.status}`}>
                <div className="plan-progress-card__head">
                  <div>
                    <span className="page-card__eyebrow">Lộ trình của bạn</span>
                    <h2>
                      {formatShort(selected.startDate)} –{' '}
                      {formatShort(selected.endDate)}
                    </h2>
                    <p className="page-card__note">
                      Bắt đầu {formatLong(selected.startDate)} · {totalDays} ngày
                    </p>
                  </div>
                  <span className={`plan-status is-${selected.status}`}>
                    {STATUS_TEXT[selected.status] ?? selected.status}
                  </span>
                </div>

                <div className="plan-progress-body">
                  <div className="plan-ring" aria-hidden="true">
                    <svg viewBox="0 0 120 120">
                      <circle
                        className="plan-ring__track"
                        cx="60"
                        cy="60"
                        r="50"
                        pathLength={100}
                      />
                      <circle
                        className="plan-ring__value"
                        cx="60"
                        cy="60"
                        r="50"
                        pathLength={100}
                        strokeDasharray="100"
                        strokeDashoffset={100 - progress}
                      />
                    </svg>
                    <span>
                      {progress}
                      <em>%</em>
                    </span>
                  </div>
                  <div className="plan-progress-copy">
                    <strong>
                      {selected.doneTasks}/{selected.totalTasks} nhiệm vụ
                    </strong>
                    <p>{dayCopy}</p>
                    <div className="plan-mini-stats">
                      <span>
                        <b>{taskCounts.todo}</b>
                        cần làm
                      </span>
                      <span>
                        <b>{taskCounts.upcoming}</b>
                        sắp tới
                      </span>
                      <span>
                        <b>{taskCounts.done}</b>
                        đã xong
                      </span>
                    </div>
                  </div>
                </div>

                <div className="plan-progress-foot">
                  <span>
                    <ClockIcon size={13} />
                    {selected.status === 'active'
                      ? remaining >= 0
                        ? `Còn ${remaining} ngày`
                        : `Trễ ${Math.abs(remaining)} ngày`
                      : `Kết thúc ${formatShort(selected.endDate)}`}
                  </span>
                  <div>
                    {selected.status === 'active' ? (
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => (addOpen ? setAddOpen(false) : openAddTask())}
                      >
                        <PlusIcon size={15} />
                        Thêm nhiệm vụ
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="page-btn page-btn--danger"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <TrashIcon size={15} />
                      Xóa lộ trình
                    </button>
                  </div>
                </div>

                {confirmDelete ? (
                  <div className="plan-delete-confirm">
                    <span>Xóa cả lộ trình và toàn bộ nhiệm vụ bên trong?</span>
                    <div>
                      <button
                        type="button"
                        className="page-btn page-btn--danger"
                        onClick={() => void deleteSelected()}
                        disabled={deleting}
                      >
                        {deleting ? 'Đang xóa...' : 'Xóa lộ trình'}
                      </button>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                      >
                        Giữ lại
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>

              <article className="page-card plan-skill-card">
                <div className="page-card__head">
                  <div>
                    <span className="page-card__eyebrow">Cơ cấu kỹ năng</span>
                    <h2>Việc gì chiếm nhiều nhất?</h2>
                  </div>
                  <span className="page-card__note">{selected.totalTasks} việc</span>
                </div>
                {breakdown.length > 0 ? (
                  <div className="plan-skill-list">
                    {breakdown.map((item) => {
                      const Icon = skillIcon(item.code)
                      const share = Math.round((item.total / Math.max(1, selected.totalTasks)) * 100)
                      const fill = Math.round((item.done / Math.max(1, item.total)) * 100)
                      return (
                        <div key={item.code} className="plan-skill">
                          <div className="plan-skill__head">
                            <span>
                              <Icon size={14} />
                              {item.name}
                            </span>
                            <em>
                              {item.done}/{item.total}
                            </em>
                          </div>
                          <span className="plan-skill__track">
                            <span
                              className="plan-skill__volume"
                              style={{ width: `${share}%` }}
                            >
                              <i style={{ width: `${fill}%` }} />
                            </span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="plan-empty-note">
                    Lộ trình chưa có nhiệm vụ. Tạo lộ trình mới để bắt đầu.
                  </p>
                )}
                <p className="page-card__note">
                  Độ dài thanh là tỉ lệ nhiệm vụ, phần đậm là việc đã xong.
                </p>
              </article>
            </section>

            <div className="plan-main">
              <article className="page-card plan-timeline-card">
                <div className="page-card__head">
                  <div>
                    <span className="page-card__eyebrow">Dòng thời gian</span>
                    <h2>Nhiệm vụ theo ngày</h2>
                  </div>
                  <span className="page-card__note">
                    {selected.totalTasks} nhiệm vụ · {progress}% hoàn thành
                  </span>
                </div>

                <div className="plan-tabs page-tabs" role="group" aria-label="Lọc nhiệm vụ">
                  {TASK_TABS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`page-tab${tab === option.value ? ' is-active' : ''}`}
                      onClick={() => setTab(option.value)}
                    >
                      {option.label}
                      <em>{taskCounts[option.value]}</em>
                    </button>
                  ))}
                </div>

                {taskError ? (
                  <p className="plan-alert" role="alert">
                    {taskError}
                  </p>
                ) : null}

                {selected.status === 'cancelled' ? (
                  <p className="plan-cancelled-note">
                    Lộ trình này đã được thay thế. Bạn vẫn xem lại được các
                    nhiệm vụ cũ.
                  </p>
                ) : null}

                {groups.length > 0 ? (
                  <div className="plan-timeline">
                    {groups.map((group) => {
                      const overdue =
                        group.tasks.some(
                          (task) => !task.isDone && task.dueDate < today,
                        ) && tab !== 'done'
                      return (
                        <div key={group.date} className="plan-daygroup">
                          <div className="plan-daygroup__head">
                            <span className="plan-daygroup__day">
                              {formatLong(group.date)}
                            </span>
                            <span
                              className={`plan-daygroup__badge${overdue ? ' is-overdue' : ''}${
                                group.date === today ? ' is-today' : ''
                              }`}
                            >
                              {group.date === today
                                ? 'Hôm nay'
                                : relativeDay(group.date, today)}
                            </span>
                            <span className="plan-daygroup__count">
                              {group.done}/{group.tasks.length}
                            </span>
                          </div>
                          <div className="plan-tasklist">
                            {group.tasks.map((task) => {
                              const Icon = skillIcon(task.skillCode)
                              const isOverdue = !task.isDone && task.dueDate < today
                              return (
                                <div
                                  key={task.id}
                                  className={`plan-task${task.isDone ? ' is-done' : ''}${
                                    isOverdue ? ' is-overdue' : ''
                                  }`}
                                >
                                  <label className="plan-check">
                                    <input
                                      type="checkbox"
                                      checked={task.isDone}
                                      onChange={() => void toggleTask(task)}
                                      disabled={
                                        togglingId === task.id ||
                                        selected.status === 'cancelled'
                                      }
                                      aria-label={`Đánh dấu ${task.title}`}
                                    />
                                    <span>
                                      {togglingId === task.id ? (
                                        <span
                                          className="spinner plan-check__spinner"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <CheckIcon size={12} />
                                      )}
                                    </span>
                                  </label>
                                  <div className="plan-task__body">
                                    <div className="plan-task__title">
                                      <span className="plan-task__icon">
                                        <Icon size={13} />
                                      </span>
                                      <strong>{task.title}</strong>
                                    </div>
                                    <div className="plan-task__meta">
                                      <span className="plan-skill-chip">
                                        {task.skillNameVi}
                                      </span>
                                      <span
                                        className={`plan-due${isOverdue ? ' is-overdue' : ''}`}
                                      >
                                        {relativeDay(task.dueDate, today)}
                                      </span>
                                      {task.isDone ? (
                                        <span className="plan-done-chip">Đã xong</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="plan-timeline-empty">
                    <span>
                      <CheckIcon size={20} />
                    </span>
                    <h3>
                      {tab === 'todo'
                        ? 'Hôm nay bạn đã xong việc'
                        : tab === 'upcoming'
                          ? 'Chưa có việc sắp tới'
                          : tab === 'done'
                            ? 'Chưa có nhiệm vụ nào hoàn thành'
                            : 'Lộ trình chưa có nhiệm vụ'}
                    </h3>
                    <p>
                      {tab === 'todo'
                        ? 'Mọi nhiệm vụ đến hạn hôm nay đều đã hoàn thành. Xem tab Sắp tới để chuẩn bị cho ngày mai.'
                        : 'Chuyển tab khác hoặc thêm nhiệm vụ mới cho lộ trình.'}
                    </p>
                  </div>
                )}

                <p className="page-card__note">
                  Đánh dấu hoàn thành khi bạn thực sự làm xong. Việc đã xong vẫn
                  được giữ lại trong tab “Đã xong”.
                </p>
              </article>

              <aside className="plan-rail">
                {selected.status === 'active' && addOpen ? (
                  <form className="page-card plan-add-card" onSubmit={submitTask}>
                    <div className="page-card__head">
                      <div>
                        <span className="page-card__eyebrow">Nhiệm vụ tự thêm</span>
                        <h2>Thêm việc cho lộ trình</h2>
                      </div>
                      <button
                        type="button"
                        className="page-btn page-btn--icon"
                        onClick={() => setAddOpen(false)}
                        aria-label="Đóng form thêm nhiệm vụ"
                      >
                        <CloseIcon size={15} />
                      </button>
                    </div>
                    <label className="plan-field">
                      <span>Tên nhiệm vụ</span>
                      <input
                        value={taskTitle}
                        onChange={(event) => setTaskTitle(event.target.value)}
                        placeholder="vd: Ôn 10 từ về du lịch"
                        maxLength={200}
                        autoFocus
                      />
                    </label>
                    <div className="plan-field-row">
                      <label className="plan-field">
                        <span>Kỹ năng</span>
                        <select
                          value={taskSkillId ?? ''}
                          onChange={(event) =>
                            setTaskSkillId(
                              event.target.value ? Number(event.target.value) : null,
                            )
                          }
                        >
                          {skills.map((skill) => (
                            <option key={skill.id} value={skill.id}>
                              {skill.nameVi}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="plan-field">
                        <span>Ngày</span>
                        <input
                          type="date"
                          value={taskDue}
                          min={selected.startDate}
                          max={selected.endDate}
                          onChange={(event) => setTaskDue(event.target.value)}
                        />
                      </label>
                    </div>
                    {addTaskError ? (
                      <p className="plan-alert" role="alert">
                        {addTaskError}
                      </p>
                    ) : null}
                    <div className="plan-add-card__actions">
                      <button
                        type="submit"
                        className="page-btn page-btn--primary"
                        disabled={addingTask}
                      >
                        {addingTask ? (
                          <span className="spinner" aria-hidden="true" />
                        ) : (
                          <PlusIcon size={15} />
                        )}
                        {addingTask ? 'Đang thêm...' : 'Thêm nhiệm vụ'}
                      </button>
                    </div>
                  </form>
                ) : null}

                <article className="page-card plan-history-card">
                  <div className="page-card__head">
                    <div>
                      <span className="page-card__eyebrow">Lịch sử</span>
                      <h2>Lộ trình khác</h2>
                    </div>
                    <span className="page-card__note">{plans.length}</span>
                  </div>
                  <div className="plan-history">
                    {plans.map((plan) => {
                      const pct =
                        plan.totalTasks === 0
                          ? 0
                          : Math.round((plan.doneTasks / plan.totalTasks) * 100)
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          className={`plan-history__row${
                            plan.id === selected.id ? ' is-active' : ''
                          }`}
                          onClick={() => {
                            setSelectedId(plan.id)
                            setConfirmDelete(false)
                            setAddOpen(false)
                            setTaskError('')
                          }}
                        >
                          <span className="plan-history__top">
                            <strong>
                              {formatShort(plan.startDate)} – {formatShort(plan.endDate)}
                            </strong>
                            <em className={`is-${plan.status}`}>
                              {STATUS_TEXT[plan.status] ?? plan.status}
                            </em>
                          </span>
                          <span className="plan-history__meta">
                            {plan.doneTasks}/{plan.totalTasks} nhiệm vụ · {pct}%
                          </span>
                          <span className="plan-history__track">
                            <i style={{ width: `${pct}%` }} />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </article>

                <article className="page-card plan-tips-card">
                  <div className="page-card__head">
                    <div>
                      <span className="page-card__eyebrow">Cách dùng</span>
                      <h2>Lộ trình được tạo thế nào?</h2>
                    </div>
                  </div>
                  <ul className="plan-tips">
                    <li>
                      <span>
                        <TargetIcon size={14} />
                      </span>
                      <div>
                        <strong>Dựa trên dữ liệu thật</strong>
                        <p>Trình độ, mục tiêu ngày và điểm kỹ năng của bạn.</p>
                      </div>
                    </li>
                    <li>
                      <span>
                        <CalendarIcon size={14} />
                      </span>
                      <div>
                        <strong>Chia đều theo ngày</strong>
                        <p>Mỗi ngày vài việc ngắn, không dồn vào cuối tuần.</p>
                      </div>
                    </li>
                    <li>
                      <span>
                        <SparkIcon size={14} />
                      </span>
                      <div>
                        <strong>Tạo mới thay lộ trình cũ</strong>
                        <p>Lộ trình đang chạy được giữ lại trong lịch sử.</p>
                      </div>
                    </li>
                  </ul>
                  <div className="plan-tips__links">
                    <Link to="/app/stats" className="page-btn">
                      <ChartIcon size={15} />
                      Xem tiến bộ
                    </Link>
                    <Link to="/app/words" className="page-btn">
                      <BookmarkIcon size={15} />
                      Ôn từ
                    </Link>
                  </div>
                </article>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </AppScaffold>
  )
}
