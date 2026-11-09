import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import {
  ArrowRightIcon,
  CheckIcon,
  MailIcon,
  SparkIcon,
} from '../components/Icons'
import { PasswordField } from '../components/PasswordField'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import '../styles/auth.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'Bạn nhập email đã đăng ký nhé.'
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Email chưa đúng định dạng.'
    if (!password) next.password = 'Bạn nhập mật khẩu để tiếp tục.'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!validate() || loading) return

    setLoading(true)
    try {
      await login(email, password, remember)
      navigate('/app', { replace: true })
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa thể đăng nhập lúc này. Vui lòng thử lại.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handlePasswordKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState('CapsLock'))
  }

  return (
    <AuthLayout variant="login">
      <div className="auth__intro">
        <span className="eyebrow">
          <span className="eyebrow__dot" />
          Chào mừng trở lại
        </span>
        <h1>Đăng nhập để tiếp tục</h1>
        <p>Bầu trời từ vựng của bạn vẫn đang ở đây, chờ bạn quay lại.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="form-alert" role="alert">
            <SparkIcon size={17} />
            <span>{error}</span>
          </div>
        ) : null}

        <label className="field" htmlFor="login-email">
          <span className="field__label">Email</span>
          <span className={`field__control${fieldErrors.email ? ' is-invalid' : ''}`}>
            <MailIcon size={19} className="field__icon" />
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ban@skyword.vn"
              autoComplete="email"
              inputMode="email"
              autoFocus
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.email)}
            />
          </span>
          {fieldErrors.email ? <span className="field__hint is-error">{fieldErrors.email}</span> : null}
        </label>

        <PasswordField
          id="login-password"
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu của bạn"
          autoComplete="current-password"
          invalid={Boolean(fieldErrors.password)}
          hint={
            fieldErrors.password ??
            (capsLock ? 'Caps Lock đang bật — kiểm tra lại chữ hoa nhé.' : undefined)
          }
          onKeyUp={handlePasswordKeyUp}
          disabled={loading}
        />

        <div className="form-row">
          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              disabled={loading}
            />
            <span className="check__box">
              <CheckIcon size={13} />
            </span>
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <span className="form-row__note">Phiên bảo mật 30 ngày</span>
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Đang đăng nhập...
            </>
          ) : (
            <>
              Đăng nhập
              <ArrowRightIcon size={19} />
            </>
          )}
        </button>
      </form>

      <p className="auth__switch">
        Lần đầu ghé SkyWord?{' '}
        <Link to="/register">Tạo tài khoản mới</Link>
      </p>
    </AuthLayout>
  )
}
