import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/layout/AuthShell'
import { Button } from '../components/ui/Button'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import { ArrowRightIcon, CheckIcon, MailIcon } from '../components/Icons'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import '../styles/auth.css'

type LocationState = {
  email?: string
  justRegistered?: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? null
  const { login } = useAuth()
  const [email, setEmail] = useState(state?.email ?? '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (state?.email) setEmail(state.email)
  }, [state?.email])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Nhập email và mật khẩu để đăng nhập nhé.')
      return
    }
    setLoading(true)
    try {
      await login(email, password, remember)
      navigate('/app', { replace: true })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Chưa đăng nhập được. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      pose="wave"
      eyebrow="Chào mừng trở lại"
      title={<>Đăng nhập để <span style={{ color: 'var(--pri)' }}>tiếp tục học</span></>}
      lead="Nimbo đã giữ sẵn lộ trình và chuỗi ngày của bạn."
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        {state?.justRegistered ? (
          <FeedbackBar tone="ok" title="Tài khoản đã sẵn sàng">
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckIcon size={13} /> Nhập mật khẩu để bắt đầu học.
            </span>
          </FeedbackBar>
        ) : null}
        {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

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
        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          disabled={loading}
          autoFocus={Boolean(state?.email)}
        />

        <div className="auth-form__row">
          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              disabled={loading}
            />
            <span className="check__box"><CheckIcon size={12} /></span>
            Ghi nhớ đăng nhập
          </label>
          <span className="auth-form__note">Phiên bảo mật 30 ngày</span>
        </div>

        <Button type="submit" block disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
          {!loading ? <ArrowRightIcon size={17} /> : null}
        </Button>

        <p className="auth-switch">
          Lần đầu ghé SkyWorld? <Link to="/onboarding">Tạo tài khoản mới</Link>
        </p>
      </form>
    </AuthShell>
  )
}
