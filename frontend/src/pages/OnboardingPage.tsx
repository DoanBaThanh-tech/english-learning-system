import { useMemo, useState, type ComponentType } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { BrandOrbit } from '../components/BrandOrbit'
import {
  ArrowRightIcon,
  BookIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  ChevronLeftIcon,
  EditIcon,
  GraduationIcon,
  LayersIcon,
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

type IconType = ComponentType<{ size?: number; className?: string }>

const PURPOSE_ICONS: Record<PurposeCode, IconType> = {
  communication: ChatIcon,
  study_abroad: GraduationIcon,
  work: TargetIcon,
  ielts: TrophyIcon,
  toeic: BookIcon,
  travel: CalendarIcon,
  media: PlayIcon,
  exam: EditIcon,
  other: SparkIcon,
}

const STEP_COPY = [
  {
    title: 'Bạn biết SkyWord từ đâu?',
    lead: 'Một câu trả lời nhỏ giúp SkyWord biết nên chia sẻ điều gì hữu ích hơn với bạn.',
  },
  {
    title: 'Trình độ tiếng Anh của bạn?',
    lead: 'SkyWord sẽ chọn độ khó, số từ và nhịp ôn phù hợp. Bạn có thể đổi lại bất cứ lúc nào.',
  },
  {
    title: 'Bạn học tiếng Anh để làm gì?',
    lead: 'Mục tiêu quyết định kỹ năng nào được ưu tiên trong lộ trình của bạn.',
  },
]

type LocationState = {
  onboarding?: Partial<OnboardingAnswers>
}

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
  const canContinue =
    step === 1 ? Boolean(source) : step === 2 ? Boolean(levelId) : Boolean(purpose)

  function next() {
    if (!canContinue) return
    if (step < 3) {
      setStep((current) => current + 1)
      return
    }
    const answers: OnboardingAnswers = { source, levelId, purpose }
    navigate('/register', { state: { onboarding: answers } })
  }

  return (
    <div className="onb-page">
      <div
        className="onb-page__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="onb-page__veil" aria-hidden="true" />
      <div className="onb-page__aura" aria-hidden="true" />

      <header className="onb-top site-shell">
        <Link to="/welcome" className="onb-brand" aria-label="SkyWord English - trang giới thiệu">
          <BrandOrbit size={38} />
          <span className="site-brand__word">
            <strong>SkyWord</strong>
            <em>English</em>
          </span>
        </Link>
        <div className="onb-top__right">
          <span className="onb-top__step">Bước {step}/3</span>
          <Link to="/login" className="onb-top__login">
            Đã có tài khoản? <b>Đăng nhập</b>
          </Link>
        </div>
      </header>

      <main className="onb-main site-shell">
        <section className="onb-intro">
          <span className="onb-eyebrow">
            <SparkIcon size={14} />
            Cá nhân hóa lộ trình
          </span>
          <h1>
            Ba câu hỏi,
            <br />
            <em>một lộ trình dành riêng bạn.</em>
          </h1>
          <p>
            SkyWord dùng câu trả lời để chọn độ khó, kỹ năng ưu tiên và nhịp học
            vừa sức. Không có câu nào là bắt buộc phải đúng tuyệt đối.
          </p>

          <ol className="onb-steps" aria-label="Tiến trình câu hỏi">
            {[
              { label: 'Bạn đến từ đâu', hint: 'Kênh giới thiệu' },
              { label: 'Trình độ hiện tại', hint: 'Độ khó phù hợp' },
              { label: 'Mục tiêu học', hint: 'Trọng tâm kỹ năng' },
            ].map((item, index) => {
              const number = index + 1
              const done = step > number
              const active = step === number
              return (
                <li
                  key={item.label}
                  className={`onb-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                >
                  <span className="onb-step__num">
                    {done ? <CheckIcon size={13} /> : number}
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <em>{item.hint}</em>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="onb-preview">
            <div className="onb-preview__head">
              <span>Xem trước lộ trình</span>
              <b>{level ? level.code : '—'}</b>
            </div>
            <strong className="onb-preview__title">{program.title}</strong>
            <p>{program.tagline}</p>
            <div className="onb-preview__chips">
              <span>{level ? `${level.code} · ${level.band}` : 'Chưa chọn trình độ'}</span>
              <span>{purposeChoice?.label ?? 'Chưa chọn mục tiêu'}</span>
              <span>{goal} từ/ngày</span>
            </div>
            <div className="onb-preview__bar" aria-hidden="true">
              <span style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>
        </section>

        <section className="onb-card" key={step} aria-labelledby="onb-question">
          <div className="onb-card__head">
            <span className="onb-card__count">Câu {step}/3</span>
            <span className="onb-card__hint">
              {step === 1 ? 'Chọn một kênh' : step === 2 ? 'Chọn trình độ gần nhất' : 'Chọn mục tiêu chính'}
            </span>
          </div>
          <h2 id="onb-question">{STEP_COPY[step - 1].title}</h2>
          <p className="onb-card__lead">{STEP_COPY[step - 1].lead}</p>

          {step === 1 ? (
            <div className="onb-options onb-options--source" role="group" aria-label="Bạn biết SkyWord từ đâu">
              {SOURCE_OPTIONS.map((option) => {
                const active = source === option.code
                return (
                  <button
                    key={option.code}
                    type="button"
                    className={`onb-source${active ? ' is-active' : ''}`}
                    onClick={() => setSource(option.code)}
                    aria-pressed={active}
                  >
                    <span className="onb-source__mark">{option.mark}</span>
                    <span className="onb-source__copy">
                      <strong>{option.label}</strong>
                      <em>{option.hint}</em>
                    </span>
                    <span className="onb-check">{active ? <CheckIcon size={12} /> : null}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onb-options onb-options--level" role="group" aria-label="Trình độ tiếng Anh hiện tại">
              {LEVEL_CHOICES.map((option) => {
                const active = levelId === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`onb-level${active ? ' is-active' : ''}`}
                    onClick={() => setLevelId(option.id)}
                    aria-pressed={active}
                  >
                    <span className="onb-level__code">{option.code}</span>
                    <span className="onb-level__copy">
                      <strong>{option.label}</strong>
                      <em>{option.description}</em>
                    </span>
                    <span className="onb-level__band">{option.band}</span>
                    <span className="onb-check">{active ? <CheckIcon size={12} /> : null}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="onb-options onb-options--purpose" role="group" aria-label="Mục tiêu học tiếng Anh">
              {PURPOSE_OPTIONS.map((option) => {
                const Icon = PURPOSE_ICONS[option.code]
                const active = purpose === option.code
                return (
                  <button
                    key={option.code}
                    type="button"
                    className={`onb-purpose${active ? ' is-active' : ''}`}
                    onClick={() => setPurpose(option.code)}
                    aria-pressed={active}
                  >
                    <span className="onb-purpose__icon">
                      <Icon size={17} />
                    </span>
                    <span className="onb-purpose__copy">
                      <strong>{option.label}</strong>
                      <em>{option.hint}</em>
                    </span>
                    <span className="onb-check">{active ? <CheckIcon size={12} /> : null}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {step === 3 && purpose ? (
            <div className="onb-focus">
              <span className="onb-focus__icon">
                <TargetIcon size={15} />
              </span>
              <div>
                <strong>Trọng tâm gợi ý: {program.steps[0]}</strong>
                <p>
                  {program.days} ngày · {program.minutes} phút/ngày · {goal} từ/ngày.
                  Lộ trình vẫn được điều chỉnh theo tiến độ thật của bạn.
                </p>
              </div>
            </div>
          ) : null}

          <div className="onb-nav">
            {step > 1 ? (
              <button
                type="button"
                className="onb-back"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
              >
                <ChevronLeftIcon size={16} />
                Quay lại
              </button>
            ) : (
              <Link to="/welcome" className="onb-back">
                <ChevronLeftIcon size={16} />
                Để sau
              </Link>
            )}
            <button
              type="button"
              className="onb-next"
              onClick={next}
              disabled={!canContinue}
            >
              {step === 3 ? (
                <>
                  Tạo tài khoản
                  <ArrowRightIcon size={17} />
                </>
              ) : (
                <>
                  Tiếp tục
                  <ArrowRightIcon size={17} />
                </>
              )}
            </button>
          </div>

          <p className="onb-privacy">
            <LayersIcon size={13} />
            Miễn phí, không quảng cáo. Bạn có thể đổi câu trả lời trong Hồ sơ.
          </p>
        </section>
      </main>

      <footer className="onb-foot site-shell">
        <span>© 2026 SkyWord English</span>
        <span>Lộ trình cá nhân hóa từ dữ liệu thật của bạn</span>
      </footer>
    </div>
  )
}
