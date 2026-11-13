import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
} from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { BrandOrbit } from './BrandOrbit'
import {
  ArrowRightIcon,
  BookIcon,
  BookmarkIcon,
  CalendarIcon,
  ChartIcon,
  ChatIcon,
  CloseIcon,
  LayersIcon,
  MicIcon,
  UserIcon,
} from './Icons'
import '../styles/orbit-menu.css'

type IconComponent = ComponentType<{ size?: number; className?: string }>

type Feature = {
  id: string
  tag: string
  title: string
  short: string
  description: string
  icon: IconComponent
  path?: string
}

const FEATURES: Feature[] = [
  {
    id: 'context',
    tag: 'Context Lens',
    title: 'Từ điển ngữ cảnh',
    short: 'Ngữ cảnh',
    description:
      'Chọn đúng nghĩa của từ theo cả câu, kèm ví dụ và độ tin cậy thay vì nghĩa đầu tiên.',
    icon: LayersIcon,
    path: '/app/context',
  },
  {
    id: 'memory',
    tag: 'Memory Sky',
    title: 'Sổ từ & SRS',
    short: 'Sổ từ',
    description:
      'Lưu từ kèm câu gốc và ôn lại đúng lúc theo nhịp ghi nhớ riêng của bạn.',
    icon: BookmarkIcon,
    path: '/app/words',
  },
  {
    id: 'echo',
    tag: 'Echo',
    title: 'Luyện phát âm',
    short: 'Phát âm',
    description:
      'Chấm điểm, chỉ ra âm cuối chưa rõ và nghe lại bản ghi để sửa từng âm.',
    icon: MicIcon,
  },
  {
    id: 'chat',
    tag: 'Chat',
    title: 'Gia sư AI',
    short: 'Gia sư AI',
    description:
      'Trò chuyện và sửa lỗi ngay trong ngữ cảnh, bằng cả tiếng Anh lẫn tiếng Việt.',
    icon: ChatIcon,
  },
  {
    id: 'reading',
    tag: 'Reading',
    title: 'Bài đọc hiểu',
    short: 'Bài đọc',
    description:
      'Đọc đoạn văn ngắn, tra từ tại chỗ và trả lời câu hỏi hiểu bài.',
    icon: BookIcon,
  },
  {
    id: 'plan',
    tag: 'Plan',
    title: 'Lộ trình học',
    short: 'Lộ trình',
    description:
      'Nhiệm vụ hằng ngày theo mục tiêu, trình độ và quỹ thời gian của bạn.',
    icon: CalendarIcon,
    path: '/app/plan',
  },
  {
    id: 'stats',
    tag: 'Insights',
    title: 'Thống kê tiến bộ',
    short: 'Thống kê',
    description:
      'Chuỗi ngày, hoạt động 7 ngày và điểm năm kỹ năng được cập nhật sau mỗi bài.',
    icon: ChartIcon,
    path: '/app/stats',
  },
  {
    id: 'profile',
    tag: 'Profile',
    title: 'Hồ sơ cá nhân',
    short: 'Hồ sơ',
    description:
      'Đổi tên gọi, trình độ, mục tiêu từ vựng và múi giờ học của riêng bạn.',
    icon: UserIcon,
    path: '/app/profile',
  },
]

type OrbitMenuProps = {
  open: boolean
  onClose: () => void
  userName?: string
}

export function OrbitMenu({ open, onClose, userName }: OrbitMenuProps) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }

    if (!mounted) return

    setClosing(true)
    const timer = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, 320)

    return () => window.clearTimeout(timer)
  }, [open, mounted])

  useEffect(() => {
    if (open) setSelectedId(null)
  }, [open])

  useEffect(() => {
    if (!mounted) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mounted, onClose])

  useEffect(() => {
    if (!open) return
    const active = document.activeElement
    restoreFocusRef.current = active instanceof HTMLElement ? active : null
  }, [open])

  useEffect(() => {
    if (!mounted) return
    return () => restoreFocusRef.current?.focus()
  }, [mounted])

  useEffect(() => {
    if (!mounted || closing) return
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 90)
    return () => window.clearTimeout(timer)
  }, [mounted, closing])

  if (!mounted || typeof document === 'undefined') return null

  const selected = FEATURES.find((feature) => feature.id === selectedId) ?? null

  return createPortal(
    <div
      id="orbit-menu"
      className={`orbit-menu${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Menu chức năng SkyWord"
    >
      <div className="orbit-menu__scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="orbit-menu__bg"
        style={{
          backgroundImage: `linear-gradient(155deg, rgba(4, 22, 42, 0.82), rgba(7, 45, 78, 0.6)), url(${skyBackground})`,
        }}
        aria-hidden="true"
      />
      <div className="orbit-menu__veil" aria-hidden="true" />
      <div className="orbit-menu__stars" aria-hidden="true" />

      <header className="orbit-menu__top">
        <Link
          to="/app"
          className="orbit-menu__brand"
          onClick={onClose}
          aria-label="SkyWord English - về trang chủ"
        >
          <BrandOrbit size={40} />
          <span className="site-brand__word">
            <strong>SkyWord</strong>
            <em>English</em>
          </span>
        </Link>

        <button
          ref={closeButtonRef}
          type="button"
          className="orbit-menu__close"
          onClick={onClose}
          aria-label="Đóng menu chức năng"
        >
          <CloseIcon size={22} />
        </button>
      </header>

      <div className="orbit-menu__stage-wrap">
        <div className="orbit-menu__stage">
          <span className="orbit-menu__ring orbit-menu__ring--outer" aria-hidden="true" />
          <span className="orbit-menu__ring orbit-menu__ring--dash" aria-hidden="true" />
          <span className="orbit-menu__ring orbit-menu__ring--inner" aria-hidden="true" />

          <svg className="orbit-menu__spokes" viewBox="0 0 200 200" aria-hidden="true">
            {FEATURES.map((feature, index) => {
              const radians = ((index * 360) / FEATURES.length - 90) * (Math.PI / 180)
              const x = 100 + 78 * Math.cos(radians)
              const y = 100 + 78 * Math.sin(radians)
              return (
                <line
                  key={feature.id}
                  x1="100"
                  y1="100"
                  x2={x}
                  y2={y}
                  pathLength={1}
                  className={selectedId === feature.id ? 'is-active' : ''}
                  style={{ '--order': index } as CSSProperties}
                />
              )
            })}
          </svg>

          <button
            type="button"
            className="orbit-menu__hub"
            onClick={() => setSelectedId(null)}
            aria-label="Xem lại giới thiệu menu"
          >
            <BrandOrbit size={96} className="orbit-menu__hub-orbit" />
            <span className="orbit-menu__hub-word">
              <strong>SkyWord</strong>
              <em>English</em>
            </span>
            <span className="orbit-menu__hub-caption">{FEATURES.length} chức năng</span>
          </button>

          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            const angle = (index * 360) / FEATURES.length - 90
            const isActive = selectedId === feature.id
            return (
              <div
                key={feature.id}
                className="orbit-menu__node"
                style={{ '--angle': `${angle}deg`, '--order': index } as CSSProperties}
              >
                <button
                  type="button"
                  className={`orbit-menu__node-button${isActive ? ' is-active' : ''}${
                    feature.path ? ' is-live' : ''
                  }`}
                  onClick={() => setSelectedId(isActive ? null : feature.id)}
                  aria-pressed={isActive}
                  aria-label={`${feature.title}. ${feature.description}${
                    feature.path ? ' Đã mở.' : ''
                  }`}
                >
                  <Icon size={26} />
                  <span className="orbit-menu__node-label">{feature.short}</span>
                  {feature.path ? (
                    <span className="orbit-menu__node-live" aria-hidden="true" />
                  ) : null}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="orbit-menu__bottom">
        <div
          className="orbit-menu__dock"
          key={selected?.id ?? 'default'}
          aria-live="polite"
        >
          <div className="orbit-menu__dock-copy">
            <span className="orbit-menu__eyebrow">
              {selected
                ? selected.tag
                : userName
                  ? `Xin chào, ${userName}`
                  : 'SkyWord English'}
            </span>
            <h2>
              {selected ? selected.title : 'Một vòng tròn, cả bầu trời tiếng Anh.'}
            </h2>
            <p>
              {selected
                ? selected.description
                : 'Chạm vào một vòng quanh quỹ đạo để xem chức năng bạn sắp mở.'}
            </p>
          </div>
          {selected?.path ? (
            <Link to={selected.path} className="orbit-menu__cta" onClick={onClose}>
              Mở chức năng
              <ArrowRightIcon size={16} />
            </Link>
          ) : (
            <span className={`orbit-menu__chip${selected ? ' is-soon' : ''}`}>
              {selected ? 'Sắp mở' : `${FEATURES.length} chức năng`}
            </span>
          )}
        </div>

        <nav className="orbit-menu__quick" aria-label="Điều hướng nhanh">
          <button type="button" onClick={onClose}>
            Về trang chủ
          </button>
          <span aria-hidden="true">·</span>
          <Link to="/welcome" onClick={onClose}>
            Giới thiệu SkyWord
          </Link>
        </nav>
      </div>
    </div>,
    document.body,
  )
}
