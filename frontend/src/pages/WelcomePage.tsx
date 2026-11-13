import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SkyLogo } from '../components/SkyLogo'
import { NimboMascot } from '../components/mascot/NimboMascot'
import {
  ArrowRightIcon,
  BookIcon,
  BookmarkIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  FlameIcon,
  MicIcon,
  PlayIcon,
  SearchIcon,
  SpeakerIcon,
  SparkIcon,
  TargetIcon,
} from '../components/Icons'
import { useAuth } from '../lib/AuthContext'
import '../styles/welcome.css'

const STRIP = [
  'Tra từ',
  'Ngữ cảnh',
  'Phát âm',
  'Flashcard',
  'Chatbot AI',
  'Bài đọc',
  'Tiến độ',
]

export function WelcomePage() {
  const { user } = useAuth()

  return (
    <div className="welcome">
      <header className="welcome__header">
        <div className="sky-shell welcome__header-inner">
          <SkyLogo />
          <div className="welcome__header-actions">
            <Link to={user ? '/app' : '/login'} className="welcome__link">
              {user ? 'Vào học' : 'Đăng nhập'}
            </Link>
            <Link
              to={user ? '/app' : '/onboarding'}
              className="btn btn--sm"
            >
              {user ? 'VÀO HỌC' : 'BẮT ĐẦU'}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="sky-shell welcome__hero">
          <div className="welcome__stage">
            <div className="welcome__nimbo">
              <NimboMascot pose="idle" interactive ariaLabel="Nimbo, chú mây 3D, kéo để xoay" />
            </div>
            <span className="welcome__stage-hint">Kéo để xoay · chạm để Nimbo vẫy tay</span>
          </div>

          <div className="welcome__copy">
            <span className="welcome__eyebrow">
              <SparkIcon size={14} />
              Học tiếng Anh cùng Nimbo
            </span>
            <h1>
              <span className="welcome__title-line">Cách học tiếng Anh</span>
              <span className="welcome__title-blue">vui nhộn, hiệu quả</span>
              <span className="welcome__title-line">cùng Nimbo!</span>
            </h1>
            <p>
              Hiểu từ theo ngữ cảnh, nhớ lâu bằng flashcard, luyện nói có AI chấm
              và giữ nhịp học mỗi ngày — tất cả trong một nơi.
            </p>

            <div className="welcome__actions">
              <Link to={user ? '/app' : '/onboarding'} className="btn btn--block">
                {user ? 'VÀO HỌC NGAY' : 'BẮT ĐẦU'}
                <ArrowRightIcon size={18} />
              </Link>
              <Link to={user ? '/app' : '/login'} className="btn btn--sec btn--block">
                {user ? 'XEM TIẾN ĐỘ' : 'TÔI ĐÃ CÓ TÀI KHOẢN'}
              </Link>
            </div>

            <span className="welcome__note">
              <CheckIcon size={14} />
              Miễn phí · Không quảng cáo · Dữ liệu của bạn được giữ riêng tư
            </span>
          </div>
        </section>

        <div className="welcome__strip">
          <div className="sky-shell welcome__strip-inner">
            {STRIP.map((item, index) => (
              <span key={item} style={{ display: 'contents' }}>
                <span>{item}</span>
                {index < STRIP.length - 1 ? <i aria-hidden="true" /> : null}
              </span>
            ))}
          </div>
        </div>

        <section className="sky-shell welcome__features" id="features">
          <Feature
            title="hiểu đúng nghĩa từng từ"
            description={
              <>
                Một từ có thể có nhiều nghĩa. SkyWorld đọc cả câu để chọn{' '}
                <strong>nghĩa đúng ngữ cảnh</strong>, kèm phiên âm, ví dụ và bản
                dịch. Bạn lưu từ vào <strong>sổ từ vựng</strong> theo thẻ và thư mục.
              </>
            }
            points={['Dịch theo ngữ cảnh', 'Tra nghĩa + phiên âm', 'Sổ từ có thẻ']}
            art={<PhoneArt />}
          />

          <Feature
            flip
            title="nhớ lâu nhờ khoa học"
            description={
              <>
                Hệ thống ôn tập ngắt quãng <strong>SM-2</strong> tự chọn thời điểm
                bạn sắp quên. Flashcard lật thẻ, trắc nghiệm, điền từ và nghe chép
                chính tả giúp từ đi vào trí nhớ dài hạn.
              </>
            }
            points={['SM-2', 'Flashcard', 'Trắc nghiệm & điền từ']}
            art={<FlashArt />}
          />

          <Feature
            title="nói tự tin, nghe chuẩn"
            description={
              <>
                Nghe phát âm chuẩn, ghi âm và nhận phản hồi theo{' '}
                <strong>từng âm</strong>. Chatbot AI sửa ngữ pháp và đóng vai tình
                huống để bạn luyện phản xạ.
              </>
            }
            points={['TTS chuẩn', 'Chấm âm chi tiết', 'Chatbot đóng vai']}
            art={<SpeechArt />}
          />

          <Feature
            flip
            title="tiếp thêm động lực"
            description={
              <>
                Mục tiêu mỗi ngày, chuỗi ngày học và biểu đồ tiến bộ giúp bạn thấy
                rõ mình đang đi tới đâu. Mỗi ngày một chút,{' '}
                <strong>đều đặn hơn</strong> là bạn đã thắng.
              </>
            }
            points={['Mục tiêu ngày', 'Chuỗi ngày', 'Biểu đồ tiến bộ']}
            art={<StreakArt />}
          />

          <Feature
            title="lộ trình của riêng bạn"
            description={
              <>
                Bài đọc A1–C2 có thể tô <strong>từ chưa biết</strong>. Tạo bài học
                từ văn bản, video hoặc chủ đề bạn quan tâm; AI phát hiện chỗ bạn
                hay sai và gợi ý bước tiếp theo.
              </>
            }
            points={['Bài đọc A1–C2', 'Tạo bài từ văn bản', 'AI phát hiện lỗi']}
            art={<PathArt />}
          />
        </section>

        <section className="welcome__cta">
          <span className="letter l1" aria-hidden="true">A</span>
          <span className="letter l2" aria-hidden="true">θ</span>
          <span className="letter l3" aria-hidden="true">ñ</span>
          <span className="letter l4" aria-hidden="true">B2</span>
          <span className="letter l5" aria-hidden="true">C1</span>
          <span className="letter l6" aria-hidden="true">/æ/</span>

          <div className="sky-shell welcome__cta-inner">
            <span className="welcome__eyebrow">
              <SparkIcon size={14} />
              Bắt đầu hôm nay
            </span>
            <h2>học miễn phí cùng Nimbo ngay hôm nay</h2>
            <p>Chỉ vài phút mỗi ngày. Không cần thẻ, không quảng cáo.</p>
            <Link to="/onboarding" className="btn">
              BẮT ĐẦU
              <ArrowRightIcon size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="welcome__footer">
        <div className="sky-shell">
          <div className="welcome__footer-grid">
            <div className="welcome__footer-brand">
              <SkyLogo to="/" />
              <p>
                SkyWorld cùng Nimbo giúp việc học tiếng Anh mỗi ngày nhẹ nhàng,
                đúng trọng tâm và có tiến bộ nhìn thấy được.
              </p>
            </div>
            <div>
              <h3>Giới thiệu</h3>
              <ul>
                <li><a href="#features">Về SkyWorld</a></li>
                <li><a href="#features">Cách hoạt động</a></li>
                <li><Link to="/welcome">Trang chủ</Link></li>
              </ul>
            </div>
            <div>
              <h3>Tính năng</h3>
              <ul>
                <li><a href="#features">Tra từ theo ngữ cảnh</a></li>
                <li><a href="#features">Flashcard SM-2</a></li>
                <li><a href="#features">Chấm phát âm</a></li>
                <li><a href="#features">Bài đọc</a></li>
              </ul>
            </div>
            <div>
              <h3>Hỗ trợ</h3>
              <ul>
                <li><Link to="/login">Đăng nhập</Link></li>
                <li><Link to="/register">Tạo tài khoản</Link></li>
                <li><a href="#features">Câu hỏi thường gặp</a></li>
              </ul>
            </div>
            <div>
              <h3>Cộng đồng</h3>
              <ul>
                <li><a href="#features">Góc học tập</a></li>
                <li><a href="#features">Chia sẻ tiến bộ</a></li>
                <li><a href="#features">Góp ý cho Nimbo</a></li>
              </ul>
            </div>
          </div>
          <div className="welcome__footer-bottom">
            <span>© 2026 SkyWorld</span>
            <span>Học mỗi ngày cùng Nimbo.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

type FeatureProps = {
  title: string
  description: ReactNode
  points: string[]
  art: ReactNode
  flip?: boolean
}

function Feature({ title, description, points, art, flip = false }: FeatureProps) {
  return (
    <article className={`feature${flip ? ' feature--flip' : ''}`}>
      <div className="feature__copy">
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="feature__points">
          {points.map((point) => (
            <span className="chip" key={point}>
              <CheckIcon size={12} />
              {point}
            </span>
          ))}
        </div>
      </div>
      <div className="feature__art">{art}</div>
    </article>
  )
}

function PhoneArt() {
  return (
    <div className="phone" aria-label="Minh họa tra từ theo ngữ cảnh">
      <div className="phone__bar">
        <span className="phone__pill" />
        <span className="chip" style={{ fontSize: '0.55rem' }}>Ngữ cảnh</span>
      </div>
      <div className="phone__screen">
        <div className="progress progress--slim"><i style={{ width: '68%' }} /></div>
        <p className="phone__label" style={{ marginTop: 10 }}>Điền nghĩa đúng</p>
        <p className="phone__sentence">
          She deposited cash at the <b>bank</b>.
        </p>
        <div className="phone__options">
          <div className="phone__option is-right">
            nộp tiền mặt tại ngân hàng
            <CheckIcon size={14} />
          </div>
          <div className="phone__option">bờ sông <span /></div>
          <div className="phone__option">bờ biển <span /></div>
          <div className="phone__option">kho hàng <span /></div>
        </div>
      </div>
    </div>
  )
}

function FlashArt() {
  return (
    <div className="flash-stack" aria-label="Minh họa flashcard ôn tập ngắt quãng">
      <div className="flash-card">
        <small>Flashcard</small>
        <strong>serendipity</strong>
        <p>sự tình cờ may mắn</p>
      </div>
      <div className="flash-card">
        <small>Ôn lại</small>
        <strong>deposit</strong>
        <p>nộp tiền</p>
      </div>
      <div className="flash-card">
        <small>Lật thẻ</small>
        <strong>resilient</strong>
        <p>kiên cường, bền bỉ</p>
        <div className="flash-tags">
          <span>SM-2</span>
          <span>4 nút đánh giá</span>
          <span>Ôn đúng lúc</span>
        </div>
      </div>
    </div>
  )
}

const WAVE_HEIGHTS = [18, 34, 52, 30, 62, 44, 70, 38, 56, 26, 48, 34, 58, 22]

function SpeechArt() {
  return (
    <div className="speech" aria-label="Minh họa chấm phát âm 86 phần trăm">
      <div className="speech__top">
        <div>
          <span className="phone__label">Phát âm hôm nay</span>
          <div className="speech__score">86%</div>
        </div>
        <span className="chip chip--ok">
          <MicIcon size={12} /> Đã chấm
        </span>
      </div>
      <div className="wave" aria-hidden="true">
        {WAVE_HEIGHTS.map((height, index) => (
          <i
            key={index}
            style={{ height: `${height}%`, opacity: index < 9 ? 0.9 : 0.35 }}
          />
        ))}
      </div>
      <div className="speech__chips">
        <span className="chip chip--ok">/θ/ rất tốt</span>
        <span className="chip chip--ok">/r/ rõ</span>
        <span className="chip chip--bad">/ɪ/ cần ngắn hơn</span>
        <span className="chip chip--warn">âm cuối /t/</span>
      </div>
      <p style={{ marginTop: 10, color: 'var(--mut)', fontSize: '0.72rem' }}>
        Nghe lại và thử nhanh 2 lần để âm /ɪ/ gọn hơn.
      </p>
    </div>
  )
}

function StreakArt() {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  return (
    <div className="streak-card" aria-label="Minh họa chuỗi 12 ngày và mục tiêu hôm nay">
      <div className="streak-card__top">
        <div>
          <span className="phone__label">Chuỗi học</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlameIcon size={22} />
            <strong>12 ngày</strong>
          </div>
        </div>
        <span className="chip chip--gold">
          <TargetIcon size={12} /> 30 từ/ngày
        </span>
      </div>
      <div className="streak-days">
        {days.map((day, index) => (
          <span key={day} className={index < 5 || index === 6 ? 'on' : ''}>
            {day}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, color: 'var(--mut)' }}>
        <span>Hôm nay</span>
        <span>18/30 từ</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <div className="progress"><i style={{ width: '60%' }} /></div>
      </div>
      <p style={{ marginTop: 10, color: 'var(--mut)', fontSize: '0.7rem' }}>
        Còn 12 từ nữa là chạm mục tiêu. Ôn 3 từ đến hạn trước nhé?
      </p>
    </div>
  )
}

function PathArt() {
  return (
    <div className="path-art" aria-label="Minh họa đường học với các bài tròn nối nhau">
      <div className="path-line" aria-hidden="true" />
      <div className="path-node is-done" style={{ left: '6%', top: '2%' }}>
        <CheckIcon size={18} />
      </div>
      <div className="path-node" style={{ left: '30%', top: '18%' }}>
        <SearchIcon size={18} />
      </div>
      <div className="path-node" style={{ right: '10%', top: '40%' }}>
        <BookmarkIcon size={18} />
      </div>
      <div className="path-node" style={{ left: '24%', top: '62%' }}>
        <SpeakerIcon size={18} />
      </div>
      <div className="path-node is-locked" style={{ right: '12%', top: '78%' }}>
        <ClockIcon size={18} />
      </div>
      <span className="chip chip--line" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <BookIcon size={12} /> A1 → C2
      </span>
      <span className="chip chip--line" style={{ position: 'absolute', right: 0, bottom: 0 }}>
        <ChatIcon size={12} /> AI gợi ý
      </span>
      <span className="chip" style={{ position: 'absolute', right: 0, top: '8%' }}>
        <PlayIcon size={12} /> Tiếp tục
      </span>
    </div>
  )
}
