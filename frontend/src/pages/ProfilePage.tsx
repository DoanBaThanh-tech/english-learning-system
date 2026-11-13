import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppScaffold } from '../components/AppScaffold'
import {
  BookmarkIcon,
  CalendarIcon,
  CheckIcon,
  FlameIcon,
  GraduationIcon,
  MailIcon,
  ShieldIcon,
  SparkIcon,
  TargetIcon,
  TrophyIcon,
  UserIcon,
} from '../components/Icons'
import { PasswordField } from '../components/PasswordField'
import {
  ApiError,
  changePasswordRequest,
  dashboardRequest,
  levelsRequest,
  profileRequest,
  updateProfileRequest,
  type Dashboard,
  type LevelRef,
  type UserProfile,
} from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { PURPOSE_OPTIONS, purposeInfo, sourceLabel } from '../lib/personalization'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/profile.css'

const TIMEZONES = [
  { id: 'SE Asia Standard Time', label: 'Việt Nam · UTC+7' },
  { id: 'UTC', label: 'UTC · UTC+0' },
  { id: 'Tokyo Standard Time', label: 'Nhật Bản · UTC+9' },
  { id: 'Korea Standard Time', label: 'Hàn Quốc · UTC+9' },
  { id: 'China Standard Time', label: 'Trung Quốc · UTC+8' },
  { id: 'Singapore Standard Time', label: 'Singapore · UTC+8' },
  { id: 'AUS Eastern Standard Time', label: 'Sydney · UTC+10' },
  { id: 'GMT Standard Time', label: 'London · UTC+0' },
  { id: 'Central Europe Standard Time', label: 'Trung Âu · UTC+1' },
  { id: 'Eastern Standard Time', label: 'New York · UTC-5' },
  { id: 'Pacific Standard Time', label: 'Los Angeles · UTC-8' },
]

const GOAL_OPTIONS = [10, 20, 30, 50, 80]
const NAME_PATTERN = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u

type ProfileForm = {
  displayName: string
  avatarUrl: string
  levelId: number
  purpose: string
  goal: number
  timeZoneId: string
}

function toForm(profile: UserProfile): ProfileForm {
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? '',
    levelId: profile.currentLevelId ?? 0,
    purpose: profile.learningPurpose ?? '',
    goal: profile.dailyWordGoal,
    timeZoneId: profile.timeZoneId,
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function levelLabel(profile: UserProfile): string {
  if (profile.levelCode && profile.levelName) return `${profile.levelCode} · ${profile.levelName}`
  return 'Chưa chọn trình độ'
}

export function ProfilePage() {
  const { run } = useAuthedApi()
  const { updateUser } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [levels, setLevels] = useState<LevelRef[]>([])
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarBroken, setAvatarBroken] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [nextProfile, nextLevels, nextDashboard] = await Promise.all([
          run((token) => profileRequest(token)),
          run((token) => levelsRequest(token)),
          run((token) => dashboardRequest(token)),
        ])
        if (!active) return
        setProfile(nextProfile)
        setLevels(nextLevels)
        setDashboard(nextDashboard)
        setForm(toForm(nextProfile))
        setAvatarBroken(false)
      } catch (caught) {
        if (!active) return
        if (caught instanceof ApiError && caught.status === 401) return
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Chưa tải được hồ sơ. Vui lòng thử lại.',
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [run])

  const displayName = profile?.displayName.trim() || 'bạn'
  const initial = displayName.charAt(0).toUpperCase()

  const timezoneOptions = useMemo(() => {
    if (!profile) return TIMEZONES
    return TIMEZONES.some((zone) => zone.id === profile.timeZoneId)
      ? TIMEZONES
      : [{ id: profile.timeZoneId, label: profile.timeZoneId }, ...TIMEZONES]
  }, [profile])

  const goalOptions = useMemo(() => {
    if (!form) return GOAL_OPTIONS
    return GOAL_OPTIONS.includes(form.goal)
      ? GOAL_OPTIONS
      : [...GOAL_OPTIONS, form.goal].sort((a, b) => a - b)
  }, [form])

  const purposePreview = purposeInfo(form?.purpose ?? null)

  function patchForm(patch: Partial<ProfileForm>) {
    setForm((current) => (current ? { ...current, ...patch } : current))
    setSaveError('')
    setSuccess('')
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!form || !profile) return

    const cleanName = form.displayName.trim()
    if (cleanName.length < 2 || cleanName.length > 30) {
      setSaveError('Tên gọi cần từ 2 đến 30 ký tự.')
      return
    }
    if (!NAME_PATTERN.test(cleanName)) {
      setSaveError('Tên gọi chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt.')
      return
    }
    const avatar = form.avatarUrl.trim()
    if (avatar.length > 0 && !/^https?:\/\//i.test(avatar)) {
      setSaveError('Ảnh đại diện cần là đường dẫn http(s) hợp lệ hoặc để trống.')
      return
    }
    if (!Number.isFinite(form.goal) || form.goal < 1 || form.goal > 500) {
      setSaveError('Mục tiêu từ/ngày cần nằm trong khoảng 1 đến 500.')
      return
    }
    if (!form.levelId) {
      setSaveError('Chọn trình độ hiện tại của bạn.')
      return
    }

    setSaving(true)
    setSaveError('')
    setSuccess('')

    try {
      const updated = await run((token) =>
        updateProfileRequest(token, {
          displayName: cleanName,
          avatarUrl: avatar.length > 0 ? avatar : null,
          currentLevelId: form.levelId,
          dailyWordGoal: form.goal,
          timeZoneId: form.timeZoneId,
          learningPurpose: form.purpose.length > 0 ? form.purpose : null,
        }),
      )
      setProfile(updated)
      setForm(toForm(updated))
      setAvatarBroken(false)
      updateUser(updated)
      setSuccess('Đã lưu hồ sơ. Tên gọi và mục tiêu mới sẽ hiển thị trên trang chủ.')
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setSaveError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa lưu được hồ sơ. Vui lòng thử lại.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8 || newPassword.length > 20) {
      setPasswordError('Mật khẩu mới cần từ 8 đến 20 ký tự.')
      return
    }
    if (!/[^A-Za-z0-9\s]/.test(newPassword)) {
      setPasswordError('Mật khẩu mới cần ít nhất 1 ký tự đặc biệt.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu nhập lại chưa khớp.')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }

    setChangingPassword(true)
    try {
      await run((token) => changePasswordRequest(token, currentPassword, newPassword))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(
        'Đã đổi mật khẩu. Các phiên đăng nhập khác đã được thu hồi; phiên hiện tại vẫn dùng được đến khi hết hạn.',
      )
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setPasswordError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa đổi được mật khẩu. Vui lòng thử lại.',
      )
    } finally {
      setChangingPassword(false)
    }
  }

  const today = dashboard?.today
  const goal = Math.max(1, today?.dailyGoal ?? profile?.dailyWordGoal ?? 20)
  const learned = today?.wordsLearned ?? 0
  const goalPct = Math.min(100, Math.round((learned / goal) * 100))

  return (
    <AppScaffold className="profile-page">
      <section className="page-hero site-shell">
        <div className="page-hero__copy">
          <span className="page-eyebrow">
            <UserIcon size={14} />
            Hồ sơ học tập
          </span>
          <h1>
            Một hồ sơ,
            <br />
            <em>đúng cách bạn học.</em>
          </h1>
          <p>
            Điều chỉnh tên gọi, trình độ, mục tiêu từ vựng và múi giờ để SkyWord
            nhắc bạn đúng lúc — mọi dữ liệu học tập vẫn nằm trong tài khoản của bạn.
          </p>
        </div>
        <div className="page-hero__actions">
          <Link to="/app" className="page-btn">
            Về trang chủ
          </Link>
          <Link to="/app/words" className="page-btn page-btn--primary">
            <BookmarkIcon size={16} />
            Mở sổ từ
          </Link>
        </div>
      </section>

      <div className="site-shell">
        {loading ? (
          <div className="page-state" aria-live="polite">
            <span className="spinner spinner--page" aria-hidden="true" />
            <p>Đang mở hồ sơ của bạn...</p>
          </div>
        ) : error ? (
          <div className="page-state" role="alert">
            <span className="page-state__icon">
              <UserIcon size={22} />
            </span>
            <h2>Chưa tải được hồ sơ</h2>
            <p className="page-error">{error}</p>
            <div className="page-state__actions">
              <button type="button" className="page-btn page-btn--primary" onClick={() => window.location.reload()}>
                Thử lại
              </button>
            </div>
          </div>
        ) : profile && form ? (
          <div className="profile-layout">
            <aside className="profile-id page-card">
              <div className="profile-id__top">
                <div className="profile-avatar">
                  {form.avatarUrl && !avatarBroken ? (
                    <img
                      src={form.avatarUrl}
                      alt=""
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                  <span className="profile-avatar__ring" aria-hidden="true" />
                </div>
                <span className="profile-id__level">
                  <GraduationIcon size={14} />
                  {levelLabel(profile)}
                </span>
                <h2>{displayName}</h2>
                <p className="profile-id__email">
                  <MailIcon size={14} />
                  {profile.email}
                </p>
                <p className="profile-id__joined">
                  <CalendarIcon size={14} />
                  Thành viên từ {formatDate(profile.createdAt)}
                </p>
                {profile.referralSource ? (
                  <p className="profile-id__joined">
                    <SparkIcon size={14} />
                    Biết SkyWord qua {sourceLabel(profile.referralSource)}
                  </p>
                ) : null}
              </div>

              <div className="profile-goal">
                <div className="profile-goal__ring" aria-hidden="true">
                  <svg viewBox="0 0 120 120">
                    <circle className="profile-goal__track" cx="60" cy="60" r="48" pathLength={100} />
                    <circle
                      className="profile-goal__value"
                      cx="60"
                      cy="60"
                      r="48"
                      pathLength={100}
                      strokeDasharray="100"
                      strokeDashoffset={100 - goalPct}
                    />
                  </svg>
                  <span>
                    <strong>{learned}</strong>
                    <em>/{goal}</em>
                  </span>
                </div>
                <div>
                  <span className="page-card__eyebrow">Hôm nay</span>
                  <strong className="profile-goal__title">
                    {goalPct >= 100 ? 'Mục tiêu đã đạt' : `Còn ${Math.max(0, goal - learned)} từ`}
                  </strong>
                  <p>Mục tiêu {profile.dailyWordGoal} từ/ngày · {goalPct}%</p>
                </div>
              </div>

              <div className="profile-snapshot">
                <div>
                  <FlameIcon size={16} />
                  <strong>{dashboard?.streakDays ?? 0}</strong>
                  <span>ngày liên tiếp</span>
                </div>
                <div>
                  <BookmarkIcon size={16} />
                  <strong>{dashboard?.totalWords ?? 0}</strong>
                  <span>từ trong sổ</span>
                </div>
                <div>
                  <TrophyIcon size={16} />
                  <strong>{dashboard?.masteredWords ?? 0}</strong>
                  <span>từ đã thuộc</span>
                </div>
                <div>
                  <TargetIcon size={16} />
                  <strong>{dashboard?.dueCount ?? 0}</strong>
                  <span>cần ôn hôm nay</span>
                </div>
              </div>
            </aside>

            <div className="profile-panels">
              <form className="page-card profile-form" onSubmit={handleSave}>
                <div className="page-card__head">
                  <div>
                    <span className="page-card__eyebrow">Thông tin học tập</span>
                    <h2>Cách SkyWord gọi bạn</h2>
                  </div>
                  <span className="profile-form__mark">
                    <SparkIcon size={16} />
                  </span>
                </div>

                <div className="profile-fields">
                  <label className="profile-field" htmlFor="profile-name">
                    <span>Tên gọi</span>
                    <input
                      id="profile-name"
                      value={form.displayName}
                      maxLength={30}
                      onChange={(event) => patchForm({ displayName: event.target.value })}
                      placeholder="Tên của bạn"
                      autoComplete="name"
                    />
                    <em>Chỉ chữ cái và khoảng trắng, tối đa 30 ký tự.</em>
                  </label>

                  <label className="profile-field" htmlFor="profile-avatar">
                    <span>Ảnh đại diện (đường dẫn)</span>
                    <input
                      id="profile-avatar"
                      value={form.avatarUrl}
                      maxLength={500}
                      onChange={(event) => {
                        patchForm({ avatarUrl: event.target.value })
                        setAvatarBroken(false)
                      }}
                      placeholder="https://..."
                      autoComplete="url"
                    />
                    <em>Để trống để dùng chữ cái đầu của tên.</em>
                  </label>

                  <label className="profile-field" htmlFor="profile-level">
                    <span>Trình độ hiện tại</span>
                    <span className="profile-select">
                      <select
                        id="profile-level"
                        value={form.levelId}
                        onChange={(event) => patchForm({ levelId: Number(event.target.value) })}
                      >
                        <option value={0} disabled>
                          Chọn trình độ
                        </option>
                        {levels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.code} · {level.name}
                          </option>
                        ))}
                      </select>
                    </span>
                    <em>Dùng để gợi ý lộ trình và bài đọc phù hợp.</em>
                  </label>

                  <label className="profile-field" htmlFor="profile-purpose">
                    <span>Mục tiêu học tiếng Anh</span>
                    <span className="profile-select">
                      <select
                        id="profile-purpose"
                        value={form.purpose}
                        onChange={(event) => patchForm({ purpose: event.target.value })}
                      >
                        <option value="">Chọn mục tiêu</option>
                        {PURPOSE_OPTIONS.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </span>
                    <em>Quyết định chương trình và kỹ năng ưu tiên trên trang chủ.</em>
                  </label>

                  <label className="profile-field" htmlFor="profile-timezone">
                    <span>Múi giờ</span>
                    <span className="profile-select">
                      <select
                        id="profile-timezone"
                        value={form.timeZoneId}
                        onChange={(event) => patchForm({ timeZoneId: event.target.value })}
                      >
                        {timezoneOptions.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.label}
                          </option>
                        ))}
                      </select>
                    </span>
                    <em>Dùng để tính “hôm nay”, chuỗi ngày và lịch ôn.</em>
                  </label>
                </div>

                {purposePreview ? (
                  <div className="profile-purpose-note">
                    <span className="profile-purpose-note__icon">
                      <TargetIcon size={15} />
                    </span>
                    <div>
                      <strong>{purposePreview.program}</strong>
                      <span>{purposePreview.tagline}</span>
                    </div>
                  </div>
                ) : null}

                <div className="profile-goal-picker">
                  <div className="profile-goal-picker__head">
                    <span>Mục tiêu từ mỗi ngày</span>
                    <strong>{form.goal} từ</strong>
                  </div>
                  <div className="profile-goal-picker__options">
                    {goalOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={form.goal === option ? 'is-active' : ''}
                        onClick={() => patchForm({ goal: option })}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={Math.min(100, Math.max(1, form.goal))}
                    onChange={(event) => patchForm({ goal: Number(event.target.value) })}
                    aria-label="Mục tiêu từ mỗi ngày"
                  />
                  <p>Bạn có thể chọn nhanh hoặc kéo thanh để đặt mục tiêu riêng.</p>
                </div>

                {saveError ? (
                  <p className="profile-alert profile-alert--error" role="alert">
                    {saveError}
                  </p>
                ) : null}
                {success ? (
                  <p className="profile-alert profile-alert--success" role="status">
                    <CheckIcon size={15} />
                    {success}
                  </p>
                ) : null}

                <div className="profile-form__actions">
                  <button
                    type="submit"
                    className="page-btn page-btn--primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckIcon size={16} />
                        Lưu hồ sơ
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => {
                      setForm(toForm(profile))
                      setSaveError('')
                      setSuccess('')
                      setAvatarBroken(false)
                    }}
                  >
                    Hoàn tác
                  </button>
                </div>
              </form>

              <form className="page-card profile-security" onSubmit={handleChangePassword}>
                <div className="page-card__head">
                  <div>
                    <span className="page-card__eyebrow">Bảo mật</span>
                    <h2>Đổi mật khẩu</h2>
                  </div>
                  <span className="profile-form__mark profile-form__mark--shield">
                    <ShieldIcon size={17} />
                  </span>
                </div>

                <div className="profile-fields">
                  <PasswordField
                    id="profile-current-password"
                    label="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                    maxLength={100}
                  />
                  <PasswordField
                    id="profile-new-password"
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                    placeholder="8–20 ký tự, có ký tự đặc biệt"
                    maxLength={20}
                  />
                  <PasswordField
                    id="profile-confirm-password"
                    label="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    maxLength={20}
                  />
                </div>

                {passwordError ? (
                  <p className="profile-alert profile-alert--error" role="alert">
                    {passwordError}
                  </p>
                ) : null}
                {passwordSuccess ? (
                  <p className="profile-alert profile-alert--success" role="status">
                    <CheckIcon size={15} />
                    {passwordSuccess}
                  </p>
                ) : null}

                <div className="profile-form__actions">
                  <button
                    type="submit"
                    className="page-btn page-btn--primary"
                    disabled={
                      changingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                  >
                    {changingPassword ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        Đang đổi...
                      </>
                    ) : (
                      <>
                        <ShieldIcon size={16} />
                        Đổi mật khẩu
                      </>
                    )}
                  </button>
                  <span className="profile-security__note">
                    Đổi mật khẩu sẽ thu hồi các phiên đăng nhập khác.
                  </span>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AppScaffold>
  )
}
