import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { BrandOrbit } from '../components/BrandOrbit'
import {
  ArrowRightIcon,
  BookmarkIcon,
  LayersIcon,
  LogoutIcon,
  MicIcon,
  SparkIcon,
} from '../components/Icons'
import { useAuth } from '../lib/AuthContext'
import '../styles/landing.css'

const FEATURES = [
  {
    index: '01',
    tag: 'Context Lens',
    title: 'Hiểu nghĩa theo ngữ cảnh',
    description:
      'Dán cả câu, SkyWord chọn đúng nghĩa của từ thay vì nghĩa đầu tiên. “Run” trong “She runs a café” là điều hành, không phải chạy bộ.',
    icon: LayersIcon,
  },
  {
    index: '02',
    tag: 'Memory Sky',
    title: 'Sổ từ nhớ đúng lúc',
    description:
      'Lưu từ kèm câu gốc, ôn tập theo lịch thông minh và nhìn thấy tiến bộ của mình qua từng ngày học.',
    icon: BookmarkIcon,
  },
  {
    index: '03',
    tag: 'Echo & Chat',
    title: 'Luyện nói có phản hồi',
    description:
      'Chấm phát âm, chỉ ra âm cuối chưa rõ và trò chuyện cùng gia sư AI để sửa lỗi ngay trong ngữ cảnh.',
    icon: MicIcon,
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [leaving, setLeaving] = useState(false)

  async function handleLogout() {
    setLeaving(true)
    await logout()
    navigate('/welcome', { replace: true })
  }

  const initial = user?.displayName.trim().charAt(0).toUpperCase() || 'S'

  return (
    <div className={`landing${leaving ? ' is-leaving' : ''}`}>
      <div
        className="landing__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="landing__veil" aria-hidden="true" />

      <header className="site-header">
        <div className="site-shell site-header__inner">
          <Link to="/welcome" className="site-brand" aria-label="SkyWord English - trang giới thiệu">
            <BrandOrbit size={42} />
            <span className="site-brand__word">
              <strong>SkyWord</strong>
              <em>English</em>
            </span>
          </Link>

          <nav className="site-actions" aria-label="Tài khoản">
            {user ? (
              <>
                <span className="site-user">
                  <span className="site-user__avatar">{initial}</span>
                  <span className="site-user__label">
                    Xin chào, <strong>{user.displayName}</strong>
                  </span>
                </span>
                <button type="button" className="btn btn--ghost btn--compact" onClick={handleLogout}>
                  <LogoutIcon size={17} />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--compact">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn--primary btn--compact">
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="landing__main">
        <section className="hero site-shell">
          <div className="hero__copy">
            <span className="hero__pill">
              <SparkIcon size={16} />
              Bầu trời tiếng Anh của riêng bạn
            </span>
            <h1>
              Học tiếng Anh <em>theo quỹ đạo</em> của bạn.
            </h1>
            <p>
              Mỗi từ mới là một vì sao nhỏ. SkyWord giúp bạn hiểu đúng nghĩa,
              nhớ đúng lúc và nói tự tin hơn mỗi ngày — chỉ vài phút mỗi ngày.
            </p>

            <div className="hero__actions">
              {user ? (
                <a href="#features" className="btn btn--primary btn--hero">
                  Khám phá chức năng
                  <ArrowRightIcon size={19} />
                </a>
              ) : (
                <>
                  <Link to="/register" className="btn btn--primary btn--hero">
                    Bắt đầu miễn phí
                    <ArrowRightIcon size={19} />
                  </Link>
                  <a href="#features" className="btn btn--ghost btn--hero">
                    Khám phá chức năng
                  </a>
                </>
              )}
            </div>

            <p className="hero__note">Không quảng cáo · Miễn phí · Dữ liệu của bạn được giữ riêng tư</p>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <span className="hero__ring hero__ring--a" />
            <span className="hero__ring hero__ring--b" />
            <div className="hero__orbit">
              <BrandOrbit size={176} />
            </div>

            <div className="hero__mini">
              <span>Ngữ cảnh</span>
              <span>Ôn tập SRS</span>
              <span>Phát âm</span>
            </div>

            <div className="float-card float-card--context">
              <span className="float-card__label">Theo ngữ cảnh</span>
              <strong>run → điều hành</strong>
              <span className="float-card__example">She runs a small café.</span>
            </div>
            <div className="float-card float-card--review">
              <span className="float-card__dot" />
              <strong>Ôn tập hôm nay</strong>
              <span>9 từ đến hạn</span>
            </div>
            <div className="float-card float-card--speak">
              <span className="float-card__score">78</span>
              <span>/100 phát âm</span>
            </div>
          </div>
        </section>

        <section id="features" className="features site-shell">
          <div className="section-head">
            <span className="section-head__eyebrow">Một vài chức năng nổi bật</span>
            <h2>Đủ để bắt đầu, vừa đủ để học mỗi ngày.</h2>
            <p>Không menu rối. Không quá nhiều nút. Chỉ những gì bạn thực sự cần.</p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.index} className="feature-card">
                  <div className="feature-card__top">
                    <span className="feature-card__icon">
                      <Icon size={22} />
                    </span>
                    <span className="feature-card__index">{feature.index}</span>
                  </div>
                  <span className="feature-card__tag">{feature.tag}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="cta site-shell">
          <div className="cta__card">
            {user ? (
              <>
                <div>
                  <span className="cta__eyebrow">Tài khoản đã sẵn sàng</span>
                  <h2>Chào {user.displayName}, bầu trời đang chờ bạn.</h2>
                  <p>
                    Giao diện học tập đầy đủ sẽ được nối vào tài khoản này ở bước tiếp theo.
                  </p>
                </div>
                <div className="cta__actions">
                  <a href="#features" className="btn btn--ghost btn--hero">
                    Xem lại chức năng
                  </a>
                  <button type="button" className="btn btn--primary btn--hero" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="cta__eyebrow">Bắt đầu hôm nay</span>
                  <h2>Sẵn sàng mở bầu trời của bạn?</h2>
                  <p>Tạo tài khoản miễn phí và bắt đầu với từ đầu tiên.</p>
                </div>
                <div className="cta__actions">
                  <Link to="/register" className="btn btn--primary btn--hero">
                    Tạo tài khoản
                    <ArrowRightIcon size={19} />
                  </Link>
                  <Link to="/login" className="btn btn--ghost btn--hero">
                    Đăng nhập
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="landing__foot site-shell">
        <span>© 2026 SkyWord English</span>
        <span>Học theo quỹ đạo của riêng bạn.</span>
      </footer>
    </div>
  )
}
