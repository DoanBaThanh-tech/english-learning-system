import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/layout/AuthShell'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import { ArrowRightIcon, CheckIcon, MailIcon, SparkIcon, UserIcon } from '../components/Icons'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import {
  LEVEL_CHOICES,
  levelInfo,
  purposeInfo,
  sourceLabel,
  suggestedGoal,
  type OnboardingAnswers,
} from '../lib/personalization'
import '../styles/auth.css'

const GOALS = [10, 20, 30, 50]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_PATTERN = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u
const SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9\s]/

type LocationState = { onboarding?: Partial<OnboardingAnswers> }

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()
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

  const programTitle = useMemo(() => {
    if (chosenPurpose) return chosenPurpose.program
    if (chosenLevel) return `Lộ trình ${chosenLevel.code} của bạn`
    return 'Lộ trình tiếng Anh của bạn'
  }, [chosenLevel, chosenPurpose])

  function cleanName(value: string) {
    return value.replace(/[^\p{L}\p{M}\s]/gu, '').replace(/\s+/g, ' ').slice(0, 30)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const name = displayName.trim()
    if (name.length < 2) {
      setError('Tên gọi cần ít nhất 2 ký tự.')
      return
    }
    if (!NAME_PATTERN.test(name)) {
      setError('Tên gọi chỉ gồm chữ cái và khoảng trắng, không có số/ký tự đặc biệt.')
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Email chưa đúng định dạng.')
      return
    }
    if (password.length < 8 || password.length > 20) {
      setError('Mật khẩu cần từ 8 đến 20 ký tự.')
      return
    }
    if (!SPECIAL_CHAR_PATTERN.test(password)) {
      setError('Mật khẩu cần ít nhất 1 ký tự đặc biệt, ví dụ @, #, !.')
      return
    }
    if (password !== confirm) {
      setError('Hai mật khẩu chưa khớp nhau.')
      return
    }
    if (!terms) {
      setError('Bạn cần đồng ý điều khoản để tạo tài khoản.')
      return
    }

    setLoading(true)
    const normalized = email.trim().toLowerCase()
    try {
      await register({
        displayName: name,
        email: normalized,
        password,
        currentLevelId: levelId,
        dailyWordGoal: goal,
        learningPurpose: answers?.purpose ?? undefined,
        referralSource: answers?.source ?? undefined,
      })
      navigate('/login', {
        replace: true,
        state: { email: normalized, justRegistered: true },
      })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Chưa tạo được tài khoản. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      pose="wave"
      eyebrow="Bắt đầu hành trình"
      title={<>Tạo tài khoản <span style={{ color: 'var(--pri)' }}>SkyWorld</span></>}
      lead="Một phút để Nimbo chuẩn bị lộ trình đúng trình độ và mục tiêu của bạn."
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        {hasOnboarding ? (
          <div className="auth-persona">
            <div className="auth-persona__top">
              <span><SparkIcon size={13} /> Lộ trình dành riêng bạn</span>
              <Link to="/onboarding" state={{ onboarding: answers }}>Đổi câu trả lời</Link>
            </div>
            <strong>{programTitle}</strong>
            <div className="auth-persona__chips">
              {chosenLevel ? <Chip tone="line">{chosenLevel.code} · {chosenLevel.label}</Chip> : null}
              {chosenPurpose ? <Chip tone="gold">{chosenPurpose.label}</Chip> : null}
              {answers?.source ? <Chip tone="line">Biết qua {sourceLabel(answers.source)}</Chip> : null}
              <Chip>{goal} từ/ngày</Chip>
            </div>
          </div>
        ) : null}

        {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

        <Input
          label="Tên gọi"
          value={displayName}
          onChange={(event) => setDisplayName(cleanName(event.target.value))}
          placeholder="Ví dụ: Minh Anh"
          autoComplete="nickname"
          icon={<UserIcon size={18} />}
          maxLength={30}
          autoFocus
          disabled={loading}
          hint="Chỉ chữ cái và khoảng trắng, tối đa 30 ký tự."
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ban@skyworld.vn"
          autoComplete="email"
          icon={<MailIcon size={18} />}
          disabled={loading}
        />

        <div className="page-grid">
          <div className="field">
            <label htmlFor="register-level">Trình độ hiện tại</label>
            <select
              id="register-level"
              value={levelId ?? ''}
              onChange={(event) => setLevelId(event.target.value ? Number(event.target.value) : null)}
              disabled={loading}
            >
              <option value="">Để sau</option>
              {LEVEL_CHOICES.map((level) => (
                <option key={level.id} value={level.id}>{level.code} · {level.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field__label">Mục tiêu mỗi ngày</span>
            <div className="auth-goals">
              {GOALS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chip${goal === value ? ' chip--gold' : ' chip--line'}`}
                  onClick={() => setGoal(value)}
                  disabled={loading}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="8–20 ký tự, có ký tự đặc biệt"
          autoComplete="new-password"
          maxLength={20}
          disabled={loading}
          hint="Từ 8 đến 20 ký tự, gồm ít nhất 1 ký tự đặc biệt."
        />
        <Input
          label="Nhập lại mật khẩu"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Nhập lại để xác nhận"
          autoComplete="new-password"
          maxLength={20}
          disabled={loading}
        />

        <label className="check check--terms">
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            disabled={loading}
          />
          <span className="check__box"><CheckIcon size={12} /></span>
          <span>
            Tôi đồng ý với <strong>điều khoản sử dụng</strong> và{' '}
            <strong>chính sách riêng tư</strong> của SkyWorld.
          </span>
        </label>

        <Button type="submit" block disabled={loading}>
          {loading ? <span className="spinner" /> : <SparkIcon size={16} />}
          {loading ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN'}
          {!loading ? <ArrowRightIcon size={17} /> : null}
        </Button>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </form>
    </AuthShell>
  )
}
