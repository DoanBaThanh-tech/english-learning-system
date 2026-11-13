import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import {
  ArrowRightIcon,
  CheckIcon,
  GraduationIcon,
  MailIcon,
  SparkIcon,
  TargetIcon,
  UserIcon,
} from '../components/Icons'
import { PasswordField } from '../components/PasswordField'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import {
  levelInfo,
  purposeInfo,
  sourceLabel,
  suggestedGoal,
  type OnboardingAnswers,
} from '../lib/personalization'
import '../styles/auth.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_PATTERN = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u
const SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9\s]/
const MAX_NAME_LENGTH = 30
const MAX_PASSWORD_LENGTH = 20

const LEVELS = [
  { id: 1, code: 'A1', label: 'Sơ cấp' },
  { id: 2, code: 'A2', label: 'Cơ bản' },
  { id: 3, code: 'B1', label: 'Trung cấp' },
  { id: 4, code: 'B2', label: 'Trung cao' },
  { id: 5, code: 'C1', label: 'Cao cấp' },
  { id: 6, code: 'C2', label: 'Thành thạo' },
]

const GOALS = [10, 20, 30, 50] as const

type FieldErrors = {
  displayName?: string
  email?: string
  password?: string
  confirm?: string
  terms?: string
}

type LocationState = {
  onboarding?: Partial<OnboardingAnswers>
}

function passwordScore(value: string): number {
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return Math.min(4, value.length === 0 ? 0 : score)
}

const STRENGTH_LABELS = ['Quá ngắn', 'Yếu', 'Ổn', 'Khá mạnh', 'Rất mạnh']

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()

  // Câu trả lời từ trang onboarding (nếu người dùng đi qua bước hỏi thông tin).
  const answers = (location.state as LocationState | null)?.onboarding ?? null
  const chosenLevel = levelInfo(answers?.levelId ?? null)
  const chosenPurpose = purposeInfo(answers?.purpose ?? null)
  const hasOnboarding = Boolean(chosenLevel || chosenPurpose)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [levelId, setLevelId] = useState<number | null>(answers?.levelId ?? null)
  const [goal, setGoal] = useState<number>(() =>
    hasOnboarding ? suggestedGoal(chosenLevel?.code ?? null, answers?.purpose ?? null) : 20,
  )
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const strength = useMemo(() => passwordScore(password), [password])
  const strengthLabel = password.length === 0 ? '' : STRENGTH_LABELS[strength]

  function validate(): boolean {
    const next: FieldErrors = {}
    const name = displayName.trim()

    if (!name) next.displayName = 'Bạn cho SkyWord biết tên gọi nhé.'
    else if (name.length < 2) next.displayName = 'Tên gọi cần ít nhất 2 ký tự.'
    else if (name.length > MAX_NAME_LENGTH) {
      next.displayName = `Tên gọi tối đa ${MAX_NAME_LENGTH} ký tự.`
    } else if (!NAME_PATTERN.test(name)) {
      next.displayName = 'Tên gọi chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt.'
    }

    if (!email.trim()) next.email = 'Email là thông tin bắt buộc.'
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Email chưa đúng định dạng.'

    if (!password) next.password = 'Bạn tạo một mật khẩu nhé.'
    else if (password.length < 8) next.password = 'Mật khẩu cần ít nhất 8 ký tự.'
    else if (password.length > MAX_PASSWORD_LENGTH) {
      next.password = `Mật khẩu tối đa ${MAX_PASSWORD_LENGTH} ký tự.`
    } else if (!SPECIAL_CHAR_PATTERN.test(password)) {
      next.password = 'Mật khẩu cần ít nhất 1 ký tự đặc biệt, ví dụ @, #, !.'
    }

    if (!confirm) next.confirm = 'Bạn nhập lại mật khẩu để xác nhận.'
    else if (confirm.length > MAX_PASSWORD_LENGTH) {
      next.confirm = `Mật khẩu nhập lại tối đa ${MAX_PASSWORD_LENGTH} ký tự.`
    } else if (confirm !== password) next.confirm = 'Hai mật khẩu chưa khớp nhau.'

    if (!terms) next.terms = 'Bạn cần đồng ý điều khoản để tạo tài khoản.'

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  function handleNameChange(value: string) {
    // Chỉ giữ chữ cái (kể cả tiếng Việt) và khoảng trắng, gộp khoảng trắng liên tiếp.
    const cleaned = value.replace(/[^\p{L}\p{M}\s]/gu, '').replace(/\s+/g, ' ')
    setDisplayName(cleaned.slice(0, MAX_NAME_LENGTH))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!validate() || loading) return

    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()
    try {
      await register({
        displayName,
        email: normalizedEmail,
        password,
        currentLevelId: levelId,
        dailyWordGoal: goal,
        learningPurpose: answers?.purpose ?? undefined,
        referralSource: answers?.source ?? undefined,
      })
      // Tạo xong tài khoản thì chuyển sang đăng nhập, điền sẵn email vừa đăng ký.
      navigate('/login', {
        replace: true,
        state: { email: normalizedEmail, justRegistered: true },
      })
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa thể tạo tài khoản lúc này. Vui lòng thử lại.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout variant="register">
      <div className="auth__intro">
        <span className="eyebrow">
          <span className="eyebrow__dot" />
          Bắt đầu hành trình
        </span>
        <h1>Tạo tài khoản của bạn</h1>
        <p>Chỉ mất một phút để bầu trời tiếng Anh của bạn được mở ra.</p>
      </div>

      {hasOnboarding ? (
        <div className="reg-persona" aria-label="Lộ trình gợi ý từ câu trả lời của bạn">
          <div className="reg-persona__top">
            <span className="reg-persona__eyebrow">
              <SparkIcon size={14} />
              Lộ trình dành riêng bạn
            </span>
            <Link
              to="/onboarding"
              state={{ onboarding: answers }}
              className="reg-persona__edit"
            >
              Đổi câu trả lời
            </Link>
          </div>
          <strong className="reg-persona__title">
            {chosenPurpose?.program ?? 'Chương trình theo trình độ của bạn'}
          </strong>
          <div className="reg-persona__chips">
            {chosenLevel ? <span>{chosenLevel.code} · {chosenLevel.label}</span> : null}
            {chosenPurpose ? <span>{chosenPurpose.label}</span> : null}
            {answers?.source ? <span>Biết qua {sourceLabel(answers.source)}</span> : null}
            <span>{goal} từ/ngày</span>
          </div>
          <p>
            {chosenPurpose?.tagline ??
              'SkyWord dùng trình độ bạn chọn để chọn độ khó và nhịp học phù hợp.'}
          </p>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="form-alert" role="alert">
            <SparkIcon size={17} />
            <span>{error}</span>
          </div>
        ) : null}

        <label className="field" htmlFor="register-name">
          <span className="field__label">Tên gọi</span>
          <span className={`field__control${fieldErrors.displayName ? ' is-invalid' : ''}`}>
            <UserIcon size={19} className="field__icon" />
            <input
              id="register-name"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Ví dụ: Minh Anh"
              autoComplete="nickname"
              maxLength={MAX_NAME_LENGTH}
              autoFocus
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.displayName)}
            />
          </span>
          <span className={`field__hint${fieldErrors.displayName ? ' is-error' : ''}`}>
            {fieldErrors.displayName ?? 'Chỉ chữ cái và khoảng trắng, tối đa 30 ký tự.'}
          </span>
        </label>

        <label className="field" htmlFor="register-email">
          <span className="field__label">Email</span>
          <span className={`field__control${fieldErrors.email ? ' is-invalid' : ''}`}>
            <MailIcon size={19} className="field__icon" />
            <input
              id="register-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ban@skyword.vn"
              autoComplete="email"
              inputMode="email"
              maxLength={256}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.email)}
            />
          </span>
          {fieldErrors.email ? <span className="field__hint is-error">{fieldErrors.email}</span> : null}
        </label>

        <div className="form-grid">
          <label className="field" htmlFor="register-level">
            <span className="field__label">Trình độ hiện tại</span>
            <span className="field__control field__control--select">
              <GraduationIcon size={19} className="field__icon" />
              <select
                id="register-level"
                name="level"
                value={levelId ?? ''}
                onChange={(event) =>
                  setLevelId(event.target.value ? Number(event.target.value) : null)
                }
                disabled={loading}
              >
                <option value="">Để sau</option>
                {LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.code} · {level.label}
                  </option>
                ))}
              </select>
              <svg className="field__chevron" viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </label>

          <div className="field">
            <span className="field__label">Mục tiêu mỗi ngày</span>
            <div className="goal-picker" role="group" aria-label="Số từ mới mỗi ngày">
              {GOALS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`goal-chip${goal === value ? ' is-active' : ''}`}
                  onClick={() => setGoal(value)}
                  disabled={loading}
                  aria-pressed={goal === value}
                >
                  <TargetIcon size={15} />
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PasswordField
          id="register-password"
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          placeholder="8–20 ký tự, có ký tự đặc biệt"
          autoComplete="new-password"
          invalid={Boolean(fieldErrors.password)}
          hint={
            fieldErrors.password ??
            'Từ 8 đến 20 ký tự, gồm ít nhất 1 ký tự đặc biệt (ví dụ @, #, !).'
          }
          maxLength={MAX_PASSWORD_LENGTH}
          disabled={loading}
        />

        {password ? (
          <div className={`strength strength--${strength}`} aria-live="polite">
            <div className="strength__bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="strength__label">{strengthLabel}</span>
          </div>
        ) : null}

        <PasswordField
          id="register-confirm"
          label="Nhập lại mật khẩu"
          value={confirm}
          onChange={setConfirm}
          placeholder="Nhập lại để xác nhận"
          autoComplete="new-password"
          invalid={Boolean(fieldErrors.confirm)}
          hint={
            fieldErrors.confirm ??
            (confirm && confirm === password
              ? 'Hai mật khẩu đã khớp.'
              : 'Tối đa 20 ký tự, giống mật khẩu phía trên.')
          }
          maxLength={MAX_PASSWORD_LENGTH}
          disabled={loading}
        />

        <div className="form-terms">
          <label className="check check--terms">
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => setTerms(event.target.checked)}
              disabled={loading}
            />
            <span className="check__box">
              <CheckIcon size={13} />
            </span>
            <span>
              Tôi đồng ý với <strong>điều khoản sử dụng</strong> và{' '}
              <strong>chính sách riêng tư</strong> của SkyWord English.
            </span>
          </label>
          {fieldErrors.terms ? (
            <span className="field__hint is-error">{fieldErrors.terms}</span>
          ) : null}
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Đang tạo tài khoản...
            </>
          ) : (
            <>
              Tạo tài khoản
              <ArrowRightIcon size={19} />
            </>
          )}
        </button>

        <p className="form-note">
          Sau khi tạo tài khoản, bạn sẽ được chuyển tới trang đăng nhập với email
          điền sẵn. Thông tin của bạn được lưu riêng tư và chỉ dùng cho việc học.
        </p>
      </form>

      <p className="auth__switch">
        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
      </p>
    </AuthLayout>
  )
}
