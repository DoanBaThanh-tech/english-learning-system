import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SkyLogo } from '../components/SkyLogo'
import { NimboMascot } from '../components/mascot/NimboMascot'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  ArrowRightIcon,
  BookIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  ChevronLeftIcon,
  EditIcon,
  GraduationIcon,
  PlayIcon,
  SparkIcon,
  TargetIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  LEVEL_CHOICES,
  PURPOSE_OPTIONS,
  SOURCE_OPTIONS,
  buildProgram,
  levelInfo,
  purposeInfo,
  suggestedGoal,
  type OnboardingAnswers,
  type PurposeCode,
  type SourceCode,
} from '../lib/personalization'
import '../styles/onboarding.css'

const PURPOSE_ICONS = {
  communication: ChatIcon,
  study_abroad: GraduationIcon,
  work: TargetIcon,
  ielts: TrophyIcon,
  toeic: BookIcon,
  travel: CalendarIcon,
  media: PlayIcon,
  exam: EditIcon,
  other: SparkIcon,
} as const

const STEPS = [
  { label: 'Bạn biết SkyWorld từ đâu?', hint: 'Kênh giới thiệu' },
  { label: 'Trình độ hiện tại', hint: 'Chọn độ khó phù hợp' },
  { label: 'Mục tiêu học', hint: 'Chọn trọng tâm' },
]

type LocationState = { onboarding?: Partial<OnboardingAnswers> }

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const previous = (location.state as LocationState | null)?.onboarding
  const [step, setStep] = useState(1)
  const [source, setSource] = useState<SourceCode | null>(previous?.source ?? null)
  const [levelId, setLevelId] = useState<number | null>(previous?.levelId ?? null)
  const [purpose, setPurpose] = useState<PurposeCode | null>(previous?.purpose ?? null)

  const level = levelInfo(levelId)
  const purposeChoice = purposeInfo(purpose)
  const program = useMemo(
    () => buildProgram(level?.code ?? null, level?.label ?? null, purpose),
    [level?.code, level?.label, purpose],
  )
  const goal = suggestedGoal(level?.code ?? null, purpose)
  const canContinue = step === 1 ? Boolean(source) : step === 2 ? Boolean(levelId) : Boolean(purpose)
  const pose = step === 1 ? 'wave' : step === 2 ? 'think' : 'cheer'

  function next() {
    if (!canContinue) return
    if (step < 3) {
      setStep(step + 1)
      return
    }
    const answers: OnboardingAnswers = { source, levelId, purpose }
    navigate('/register', { state: { onboarding: answers } })
  }

  return (
    <div className="onb">
      <header className="onb__top sky-shell">
        <SkyLogo />
        <div className="onb__top-right">
          <Chip tone="line">Bước {step}/3</Chip>
          <Link to="/login" className="onb__login">
            <span className="onb__login-hint">Đã có tài khoản? </span>
            <b>Đăng nhập</b>
          </Link>
        </div>
      </header>

      <main className="onb__main sky-shell">
        <section className="onb__intro">
          <span className="eyebrow"><SparkIcon size={14} /> Cá nhân hóa lộ trình</span>
          <h1>Ba câu hỏi, một&nbsp;lộ&nbsp;trình <span>riêng bạn.</span></h1>
          <p>
            SkyWorld dùng câu trả lời để chọn độ khó, kỹ năng ưu tiên và nhịp học
            vừa sức. Bạn đổi lại được bất cứ lúc nào trong Hồ sơ.
          </p>

          <div className="onb__buddy">
            <NimboMascot pose={pose} size={132} ariaLabel="Nimbo đồng hành cùng bạn" />
            <div className="onb__buddy-note">
              <strong>Nimbo đang lắng nghe</strong>
              <span>Chọn gần đúng nhất là đủ, không cần suy nghĩ quá lâu.</span>
            </div>
          </div>

          <ol className="onb__steps">
            {STEPS.map((item, index) => {
              const number = index + 1
              const done = step > number
              const active = step === number
              return (
                <li key={item.label} className={done ? 'is-done' : active ? 'is-active' : ''}>
                  <span>{done ? <CheckIcon size={13} /> : number}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <em>{item.hint}</em>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="onb__preview">
            <div className="onb__preview-top">
              <span>Xem trước lộ trình</span>
              <b>{level?.code ?? '—'}</b>
            </div>
            <strong>{program.title}</strong>
            <p>{program.tagline}</p>
            <div className="onb__preview-chips">
              <Chip tone="line">{level ? `${level.code} · ${level.band}` : 'Chưa chọn trình độ'}</Chip>
              <Chip tone="line">{purposeChoice?.label ?? 'Chưa chọn mục tiêu'}</Chip>
              <Chip tone="gold">{goal} từ/ngày</Chip>
            </div>
            <ProgressBar value={step} max={3} slim label="Tiến độ câu hỏi" />
          </div>
        </section>

        <section className="onb__card card" key={step}>
          <div className="onb__card-top">
            <Chip>Câu {step}/3</Chip>
            <span>{step === 1 ? 'Chọn một kênh' : step === 2 ? 'Chọn trình độ gần nhất' : 'Chọn mục tiêu chính'}</span>
          </div>
          <h2>{STEPS[step - 1].label}</h2>
          <p className="onb__lead">
            {step === 1
              ? 'Một câu trả lời nhỏ giúp SkyWorld biết nên chia sẻ điều gì hữu ích hơn với bạn.'
              : step === 2
                ? 'SkyWorld sẽ chọn độ khó, số từ và nhịp ôn phù hợp với bạn.'
                : 'Mục tiêu quyết định kỹ năng nào được ưu tiên trong lộ trình của bạn.'}
          </p>

          {step === 1 ? (
            <div className="onb__options onb__options--source" role="group" aria-label="Bạn biết SkyWorld từ đâu">
              {SOURCE_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={`onb-option${source === option.code ? ' is-active' : ''}`}
                  onClick={() => setSource(option.code)}
                  aria-pressed={source === option.code}
                >
                  <span className="onb-option__mark">{option.mark}</span>
                  <span className="onb-option__copy">
                    <strong>{option.label}</strong>
                    <em>{option.hint}</em>
                  </span>
                  <span className="onb-option__check">{source === option.code ? <CheckIcon size={12} /> : null}</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onb__options onb__options--level" role="group" aria-label="Trình độ tiếng Anh hiện tại">
              {LEVEL_CHOICES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`onb-level${levelId === option.id ? ' is-active' : ''}`}
                  onClick={() => setLevelId(option.id)}
                  aria-pressed={levelId === option.id}
                >
                  <span className="onb-level__code">{option.code}</span>
                  <span className="onb-level__copy">
                    <strong>{option.label}</strong>
                    <em>{option.description}</em>
                  </span>
                  <Chip tone="line">{option.band}</Chip>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="onb__options onb__options--purpose" role="group" aria-label="Mục tiêu học tiếng Anh">
              {PURPOSE_OPTIONS.map((option) => {
                const Icon = PURPOSE_ICONS[option.code]
                return (
                  <button
                    key={option.code}
                    type="button"
                    className={`onb-option${purpose === option.code ? ' is-active' : ''}`}
                    onClick={() => setPurpose(option.code)}
                    aria-pressed={purpose === option.code}
                  >
                    <span className="onb-option__mark"><Icon size={15} /></span>
                    <span className="onb-option__copy">
                      <strong>{option.label}</strong>
                      <em>{option.hint}</em>
                    </span>
                    <span className="onb-option__check">{purpose === option.code ? <CheckIcon size={12} /> : null}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {step === 3 && purpose ? (
            <div className="onb__focus">
              <TargetIcon size={16} />
              <div>
                <strong>Trọng tâm gợi ý: {program.steps[0]}</strong>
                <span>{program.days} ngày · {program.minutes} phút/ngày · {goal} từ/ngày</span>
              </div>
            </div>
          ) : null}

          <div className="onb__nav">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                <ChevronLeftIcon size={15} /> Quay lại
              </Button>
            ) : (
              <Link to="/welcome" className="btn btn--sec">Để sau</Link>
            )}
            <Button onClick={next} disabled={!canContinue}>
              {step === 3 ? 'Tạo tài khoản' : 'Tiếp tục'}
              <ArrowRightIcon size={16} />
            </Button>
          </div>

          <p className="onb__privacy">
            <SparkIcon size={12} /> Miễn phí, không quảng cáo. Đổi câu trả lời trong Hồ sơ.
          </p>
        </section>
      </main>

      <footer className="onb__foot sky-shell">
        <span>© 2026 SkyWorld</span>
        <span>Lộ trình cá nhân hóa từ dữ liệu thật của bạn</span>
      </footer>
    </div>
  )
}
