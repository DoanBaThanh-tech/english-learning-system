import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import {
  BookmarkIcon,
  CalendarIcon,
  CheckIcon,
  FlameIcon,
  GraduationIcon,
  SparkIcon,
  TargetIcon,
  TrophyIcon,
  UserIcon,
} from '../components/Icons'
import {
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
import { useAuthedApi } from '../lib/useAuthedApi'
import {
  PURPOSE_OPTIONS,
  buildProgram,
  sourceLabel,
} from '../lib/personalization'
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
]

const GOALS = [10, 20, 30, 50, 80]
const NAME_PATTERN = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u

type FormState = {
  displayName: string
  avatarUrl: string
  levelId: number
  purpose: string
  goal: number
  timeZoneId: string
}

function toForm(profile: UserProfile): FormState {
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? '',
    levelId: profile.currentLevelId ?? 0,
    purpose: profile.learningPurpose ?? '',
    goal: profile.dailyWordGoal,
    timeZoneId: profile.timeZoneId,
  }
}

export function ProfilePage() {
  const { run } = useAuthedApi()
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [levels, setLevels] = useState<LevelRef[]>([])
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarBroken, setAvatarBroken] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
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
      } catch (caught) {
        if (active) setLoadError(caught instanceof Error ? caught.message : 'Chưa tải được hồ sơ.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [run])

  const program = useMemo(
    () =>
      buildProgram(
        levels.find((level) => level.id === form?.levelId)?.code ?? profile?.levelCode,
        levels.find((level) => level.id === form?.levelId)?.name ?? profile?.levelName,
        form?.purpose,
      ),
    [form?.levelId, form?.purpose, levels, profile?.levelCode, profile?.levelName],
  )

  function patch(patchValue: Partial<FormState>) {
    setForm((current) => (current ? { ...current, ...patchValue } : current))
    setSaveError('')
    setSuccess('')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    const name = form.displayName.trim()
    if (name.length < 2 || name.length > 30) {
      setSaveError('Tên gọi cần từ 2 đến 30 ký tự.')
      return
    }
    if (!NAME_PATTERN.test(name)) {
      setSaveError('Tên gọi chỉ gồm chữ cái và khoảng trắng, không có số/ký tự đặc biệt.')
      return
    }
    if (form.avatarUrl && !/^https?:\/\//i.test(form.avatarUrl.trim())) {
      setSaveError('Ảnh đại diện cần là đường dẫn http(s) hợp lệ hoặc để trống.')
      return
    }
    if (!form.levelId) {
      setSaveError('Chọn trình độ hiện tại của bạn.')
      return
    }
    setSaving(true)
    try {
      const updated = await run((token) =>
        updateProfileRequest(token, {
          displayName: name,
          avatarUrl: form.avatarUrl.trim() || null,
          currentLevelId: form.levelId,
          dailyWordGoal: form.goal,
          timeZoneId: form.timeZoneId,
          learningPurpose: form.purpose || null,
        }),
      )
      setProfile(updated)
      setForm(toForm(updated))
      updateUser(updated)
      setSuccess('Đã lưu hồ sơ. Lộ trình và gợi ý sẽ cập nhật ngay.')
      setAvatarBroken(false)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Chưa lưu được hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword.length < 8 || newPassword.length > 20) {
      setPasswordError('Mật khẩu mới cần 8–20 ký tự.')
      return
    }
    if (!/[^A-Za-z0-9\s]/.test(newPassword)) {
      setPasswordError('Mật khẩu mới cần ít nhất 1 ký tự đặc biệt.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Hai mật khẩu chưa khớp.')
      return
    }
    setChanging(true)
    try {
      await run((token) => changePasswordRequest(token, currentPassword, newPassword))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Đã đổi mật khẩu. Các phiên khác đã được thu hồi.')
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : 'Chưa đổi được mật khẩu.')
    } finally {
      setChanging(false)
    }
  }

  const displayName = profile?.displayName ?? 'bạn'
  const initial = displayName.trim().charAt(0).toUpperCase()
  const goal = dashboard?.today.dailyGoal ?? profile?.dailyWordGoal ?? 20
  const learned = dashboard?.today.wordsLearned ?? 0
  const goalPct = Math.min(100, Math.round((learned / goal) * 100))

  return (
    <div className="profile">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><UserIcon size={14} /> Hồ sơ</span>
          <h1>Cách SkyWorld gọi bạn</h1>
          <p>Điều chỉnh mục tiêu học, trình độ và nhịp nhắc việc.</p>
        </div>
        <div className="page-head__actions">
          <Link to="/app" className="btn btn--sec btn--sm">Về trang Học</Link>
        </div>
      </header>

      {loading ? (
        <Card><div className="skeleton" style={{ height: 260 }} /></Card>
      ) : loadError ? (
        <FeedbackBar tone="bad" action={<Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Thử lại</Button>}>
          {loadError}
        </FeedbackBar>
      ) : profile && form ? (
        <div className="profile__layout">
          <aside className="page-stack">
            <Card className="profile-id">
              <div className="profile-avatar">
                {form.avatarUrl && !avatarBroken ? (
                  <img src={form.avatarUrl} alt="" onError={() => setAvatarBroken(true)} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <h2>{displayName}</h2>
              <p className="profile-id__email">{profile.email}</p>
              <div className="profile-id__meta">
                <Chip tone="gold"><GraduationIcon size={11} /> {profile.levelCode ?? 'Chưa chọn'} · {profile.levelName ?? 'Trình độ'}</Chip>
                <Chip tone="line"><CalendarIcon size={11} /> Từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')}</Chip>
                {profile.referralSource ? <Chip tone="line"><SparkIcon size={11} /> {sourceLabel(profile.referralSource)}</Chip> : null}
              </div>
              <div className="profile-goal">
                <div className="profile-goal__ring" aria-hidden="true">
                  <svg viewBox="0 0 120 120">
                    <circle className="profile-goal__track" cx="60" cy="60" r="50" pathLength={100} />
                    <circle className="profile-goal__value" cx="60" cy="60" r="50" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - goalPct} />
                  </svg>
                  <span><strong>{learned}</strong><em>/{goal}</em></span>
                </div>
                <div>
                  <span className="card__eyebrow">Hôm nay</span>
                  <strong className="profile-goal__title">{goalPct >= 100 ? 'Đã đạt mục tiêu' : `Còn ${Math.max(0, goal - learned)} từ`}</strong>
                  <p>{goalPct}% mục tiêu ngày</p>
                </div>
              </div>
              <div className="profile-stats">
                <span><FlameIcon size={14} /><strong>{dashboard?.streakDays ?? 0}</strong> ngày</span>
                <span><BookmarkIcon size={14} /><strong>{dashboard?.totalWords ?? 0}</strong> từ</span>
                <span><TrophyIcon size={14} /><strong>{dashboard?.masteredWords ?? 0}</strong> thuộc</span>
                <span><TargetIcon size={14} /><strong>{dashboard?.dueCount ?? 0}</strong> cần ôn</span>
              </div>
            </Card>

            <Card sky className="profile-program">
              <span className="card__eyebrow"><SparkIcon size={13} /> Lộ trình gợi ý</span>
              <h2>{program.title}</h2>
              <p>{program.tagline}</p>
              <div className="profile-program__steps">
                {program.steps.map((step) => (
                  <span key={step}><CheckIcon size={11} /> {step}</span>
                ))}
              </div>
              <div className="profile-program__meta">
                <span>{program.goal} từ/ngày</span>
                <span>{program.minutes} phút/ngày</span>
                <span>{program.days} ngày/chặng</span>
              </div>
            </Card>
          </aside>

          <div className="page-stack">
            <form onSubmit={save} className="page-stack">
              <Card>
                <div className="card__head">
                  <div>
                    <span className="card__eyebrow">Thông tin học tập</span>
                    <h2 className="card__title">Hồ sơ của bạn</h2>
                  </div>
                  <UserIcon size={18} />
                </div>

                <div className="page-grid">
                  <Input
                    label="Tên gọi"
                    value={form.displayName}
                    onChange={(event) => patch({ displayName: event.target.value })}
                    maxLength={30}
                    placeholder="Tên của bạn"
                  />
                  <Input
                    label="Ảnh đại diện (URL)"
                    value={form.avatarUrl}
                    onChange={(event) => {
                      patch({ avatarUrl: event.target.value })
                      setAvatarBroken(false)
                    }}
                    placeholder="https://..."
                  />
                  <div className="field">
                    <label htmlFor="profile-level">Trình độ hiện tại</label>
                    <select
                      id="profile-level"
                      value={form.levelId}
                      onChange={(event) => patch({ levelId: Number(event.target.value) })}
                    >
                      <option value={0} disabled>Chọn trình độ</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>{level.code} · {level.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="profile-purpose">Mục tiêu học</label>
                    <select
                      id="profile-purpose"
                      value={form.purpose}
                      onChange={(event) => patch({ purpose: event.target.value })}
                    >
                      <option value="">Chọn mục tiêu</option>
                      {PURPOSE_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="profile-timezone">Múi giờ</label>
                    <select
                      id="profile-timezone"
                      value={form.timeZoneId}
                      onChange={(event) => patch({ timeZoneId: event.target.value })}
                    >
                      {TIMEZONES.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="profile-goal-picker">
                  <div className="profile-goal-picker__head">
                    <span>Mục tiêu từ mỗi ngày</span>
                    <strong>{form.goal} từ</strong>
                  </div>
                  <div className="profile-goal-picker__options">
                    {GOALS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={form.goal === value ? 'is-active' : ''}
                        onClick={() => patch({ goal: value })}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={Math.min(100, Math.max(1, form.goal))}
                    onChange={(event) => patch({ goal: Number(event.target.value) })}
                    aria-label="Mục tiêu từ mỗi ngày"
                  />
                </div>

                {saveError ? <FeedbackBar tone="bad">{saveError}</FeedbackBar> : null}
                {success ? <FeedbackBar tone="ok">{success}</FeedbackBar> : null}

                <div className="profile-form__actions">
                  <Button type="submit" disabled={saving}>
                    {saving ? <span className="spinner" /> : <CheckIcon size={15} />}
                    {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (profile) setForm(toForm(profile))
                      setSaveError('')
                      setSuccess('')
                    }}
                  >
                    Hoàn tác
                  </Button>
                </div>
              </Card>
            </form>

            <Card className="profile-password">
              <div className="card__head">
                <div>
                  <span className="card__eyebrow">Bảo mật</span>
                  <h2 className="card__title">Đổi mật khẩu</h2>
                </div>
                <Chip tone="line">8–20 ký tự</Chip>
              </div>
              <form onSubmit={changePassword} className="page-stack">
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                />
                <div className="page-grid">
                  <Input
                    label="Mật khẩu mới"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    hint="8–20 ký tự, có ký tự đặc biệt."
                  />
                  <Input
                    label="Nhập lại mật khẩu mới"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {passwordError ? <FeedbackBar tone="bad">{passwordError}</FeedbackBar> : null}
                {passwordSuccess ? <FeedbackBar tone="ok">{passwordSuccess}</FeedbackBar> : null}
                <Button type="submit" variant="secondary" disabled={changing || !currentPassword || !newPassword || !confirmPassword}>
                  {changing ? <span className="spinner" /> : null}
                  {changing ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
