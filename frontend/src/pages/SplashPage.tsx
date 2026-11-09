import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { BrandOrbit } from '../components/BrandOrbit'
import { ArrowRightIcon, SparkIcon } from '../components/Icons'
import { useAuth } from '../lib/AuthContext'
import '../styles/splash.css'

export function SplashPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const leftRef = useRef(false)

  const finish = useCallback(
    (delay = 380) => {
      if (leftRef.current) return
      leftRef.current = true
      window.setTimeout(() => {
        setLeaving(true)
        window.setTimeout(() => {
          navigate(user ? '/app' : '/login', { replace: true })
        }, delay)
      }, 0)
    },
    [navigate, user],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => finish(), 3500)
    return () => window.clearTimeout(timer)
  }, [finish])

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}`}>
      <div
        className="splash__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="splash__veil" aria-hidden="true" />
      <span className="splash__cloud splash__cloud--a" aria-hidden="true" />
      <span className="splash__cloud splash__cloud--b" aria-hidden="true" />
      <span className="splash__cloud splash__cloud--c" aria-hidden="true" />

      <main className="splash__stage" aria-label="Giới thiệu SkyWord English">
        <div className="splash__halo" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <BrandOrbit size={148} className="splash__orbit" />

        <span className="splash__chip splash__chip--vocab">
          <SparkIcon size={15} /> Từ vựng
        </span>
        <span className="splash__chip splash__chip--speak">Phát âm</span>
        <span className="splash__chip splash__chip--chat">Hội thoại</span>

        <h1 className="splash__title">
          <span>SkyWord</span>
          <em>English</em>
        </h1>
        <p className="splash__tagline">Học tiếng Anh theo quỹ đạo của riêng bạn</p>

        <div className="splash__progress" aria-hidden="true">
          <span />
        </div>
        <p className="splash__status">Đang chuẩn bị bầu trời của bạn</p>
      </main>

      <button type="button" className="splash__skip" onClick={() => finish(240)}>
        Bỏ qua
        <ArrowRightIcon size={17} />
      </button>
    </div>
  )
}
