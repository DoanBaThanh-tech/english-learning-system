import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SkyLogo } from '../components/SkyLogo'
import { NimboMascot, type NimboPose } from '../components/mascot/NimboMascot'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
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
import { useAuth } from '../lib/AuthContext'
import {
  LEVEL_CHOICES,
  PURPOSE_OPTIONS,
  buildProgram,
  levelInfo,
  purposeInfo,
  suggestedGoal,
  type OnboardingAnswers,
  type PurposeCode,
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

const STEP_COPY = {
  1: {
    kicker: 'Mục đích học',
    title: 'Bạn học tiếng Anh để làm gì?',
    lead: 'Chọn một mục đích gần nhất — Nimbo dùng câu trả lời để chọn chủ đề, kỹ năng và nhịp học.',
    hint: 'Chọn mục đích học nhé. Nimbo sẽ chuẩn bị đúng thứ bạn cần!',
  },
  2: {
    kicker: 'Trình độ tiếng Anh',
    title: 'Trình độ hiện tại của bạn đang ở đâu?',
    lead: 'Chọn một mức gần đúng nhất. Không cần chính xác tuyệt đối, bạn đổi lại được trong Hồ sơ.',
    hint: 'Giỏi lắm! Giờ cho Nimbo biết trình độ hiện tại của bạn nhé.',
  },
} as const

const PRAISE_LINES = [
  'Lựa chọn tuyệt vời! Nimbo sẽ đồng hành cùng bạn.',
  'Hay quá! Mình đã ghi nhớ điều này rồi.',
  'Chuẩn luôn! Lộ trình sẽ hợp với bạn hơn.',
  'Mình thích lựa chọn này! Cùng tiến về phía trước nhé.',
  'Tuyệt! Bạn đang đi đúng hướng rồi đấy.',
  'Ghi nhận nhé! Nimbo sẽ chuẩn bị bài học thật vừa sức.',
  'Chọn hay lắm! Mình sẽ tập trung đúng phần bạn cần.',
  'Tự tin lên! Có Nimbo ở đây rồi.',
]

type LocationState = { onboarding?: Partial<OnboardingAnswers> }

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const previous = (location.state as LocationState | null)?.onboarding
  const [step, setStep] = useState<1 | 2>(1)
  const [purpose, setPurpose] = useState<PurposeCode | null>(previous?.purpose ?? null)
  const [levelId, setLevelId] = useState<number | null>(previous?.levelId ?? null)
  const [pose, setPose] = useState<NimboPose>('wave')
  const [praise, setPraise] = useState<string>(STEP_COPY[1].hint)
  const [praiseKey, setPraiseKey] = useState(0)
  const praiseRef = useRef(-1)

  const level = levelInfo(levelId)
  const purposeChoice = purposeInfo(purpose)
  const program = useMemo(
    () => buildProgram(level?.code ?? null, level?.label ?? null, purpose),
    [level?.code, level?.label, purpose],
  )
  const goal = suggestedGoal(level?.code ?? null, purpose)
  const canContinue = step === 1 ? Boolean(purpose) : Boolean(levelId)
  const copy = STEP_COPY[step]

  function pickPraise() {
    let next = Math.floor(Math.random() * PRAISE_LINES.length)
    if (next === praiseRef.current) next = (next + 1) % PRAISE_LINES.length
    praiseRef.current = next
    setPraise(PRAISE_LINES[next])
    setPraiseKey((value) => value + 1)
    setPose('cheer')
  }

  function choosePurpose(code: PurposeCode) {
    if (purpose === code) return
    setPurpose(code)
    pickPraise()
  }

  function chooseLevel(id: number) {
    if (levelId === id) return
    setLevelId(id)
    pickPraise()
  }

  function goNext() {
    if (!canContinue) return
    if (step === 1) {
      setStep(2)
      setPose('wave')
      setPraise(STEP_COPY[2].hint)
      setPraiseKey((value) => value + 1)
      return
    }

    const answers: OnboardingAnswers = { source: null, levelId, purpose }
    if (user) {
      navigate('/app')
      return
    }
    navigate('/register', { state: { onboarding: answers } })
  }

  function goBack() {
    setStep(1)
    setPose('wave')
    setPraise(STEP_COPY[1].hint)
    setPraiseKey((value) => value + 1)
  }

  return (
    <div className="onb">
      <div className="onb__aurora" aria-hidden="true" />
      <header className="onb__top sky-shell">
        <SkyLogo />
        <div className="onb__top-right">
          <span className="onb__step-chip">Bước {step}/2</span>
          <Link to="/login" className="onb__login">
            <span className="onb__login-hint">Đã có tài khoản? </span>
            <b>Đăng nhập</b>
          </Link>
        </div>
      </header>

      <main className="onb__main sky-shell">
        <section className="onb__stage">
          <div className="onb__halo" aria-hidden="true" />

          <div className="onb__bubble" key={praiseKey} role="status" aria-live="polite">
            <SparkIcon size={14} />
            <span>{praise}</span>
          </div>

          <div className="onb__mascot">
            <NimboMascot
              pose={pose}
              size="clamp(200px, 23vw, 420px)"
              interactive
              onClick={pickPraise}
              ariaLabel="Nimbo, bạn đồng hành. Chạm để Nimbo cổ vũ bạn."
            />
          </div>

          <div className="onb__mascot-name">
            <strong>Nimbo</strong>
            <span>Bạn đồng hành của bạn</span>
          </div>

          <div className={`onb__preview${purpose && levelId ? ' is-ready' : ''}`}>
            <div className="onb__preview-head">
              <SparkIcon size={13} /> Lộ trình dự kiến
            </div>
            <strong>{program.title}</strong>
            <p>{program.tagline}</p>
            <div className="onb__preview-chips">
              <Chip tone="line">{level ? `${level.code} · ${level.label}` : 'Chưa chọn trình độ'}</Chip>
              <Chip tone="line">{purposeChoice?.label ?? 'Chưa chọn mục tiêu'}</Chip>
              <Chip tone="gold">{goal} từ/ngày</Chip>
            </div>
          </div>
        </section>

        <section className="onb__card" key={step}>
          <div className="onb__card-top">
            <span className="onb__step-label">
              {step === 1 ? '01' : '02'} · {copy.kicker}
            </span>
            <span className="onb__single">
              <CheckIcon size={11} /> Chọn 1 đáp án
            </span>
          </div>

          <div className="onb__progress" aria-hidden="true">
            <i style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>

          <h1>{copy.title}</h1>
          <p className="onb__lead">{copy.lead}</p>

          {step === 1 ? (
            <div
              className="onb__options onb__options--purpose"
              role="radiogroup"
              aria-label="Mục đích học tiếng Anh"
            >
              {PURPOSE_OPTIONS.map((option, index) => {
                const Icon = PURPOSE_ICONS[option.code]
                const active = purpose === option.code
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-index={index}
                    className={`onb-choice${active ? ' is-active' : ''}`}
                    style={{ '--i': index } as CSSProperties}
                    onClick={() => choosePurpose(option.code)}
                  >
                    <span className="onb-choice__icon">
                      <Icon size={17} />
                    </span>
                    <span className="onb-choice__copy">
                      <strong>{option.label}</strong>
                      <em>{option.hint}</em>
                    </span>
                    <span className="onb-choice__check">
                      {active ? <CheckIcon size={12} /> : null}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div
              className="onb__options onb__options--level"
              role="radiogroup"
              aria-label="Trình độ tiếng Anh hiện tại"
            >
              {LEVEL_CHOICES.map((option, index) => {
                const active = levelId === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-index={index}
                    className={`onb-choice onb-choice--level${active ? ' is-active' : ''}`}
                    style={{ '--i': index } as CSSProperties}
                    onClick={() => chooseLevel(option.id)}
                  >
                    <span className="onb-choice__code">{option.code}</span>
                    <span className="onb-choice__copy">
                      <span className="onb-choice__title">
                        <strong>{option.label}</strong>
                        <i>{option.band}</i>
                      </span>
                      <em>{option.description}</em>
                    </span>
                    <span className="onb-choice__check">
                      {active ? <CheckIcon size={12} /> : null}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="onb__nav">
            {step === 1 ? (
              <Link to="/welcome" className="btn btn--sec">Để sau</Link>
            ) : (
              <Button variant="secondary" onClick={goBack}>
                <ChevronLeftIcon size={15} /> Quay lại
              </Button>
            )}
            <Button onClick={goNext} disabled={!canContinue}>
              {step === 1 ? 'Tiếp tục' : 'Tạo tài khoản'}
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
