import { useEffect, useRef, useState } from 'react'
import { LevelMascot, type LevelMascotMood } from './LevelMascot'
import type { MascotId } from '../../lib/mascots'

type Props = {
  mascot: MascotId
  mood?: LevelMascotMood
  quality?: 'full' | 'mini'
  className?: string
  ariaLabel?: string
  decorative?: boolean
}

/* Chỉ dựng canvas 3D khi linh vật ở gần khung nhìn.
   Bản đồ có 12 level nên cách này giữ số WebGL context thấp, cuộn tới đâu
   mới dựng tới đó và tự dọn khi cuộn qua. */
export function LazyLevelMascot({
  mascot,
  mood = 'idle',
  quality = 'mini',
  className = '',
  ariaLabel,
  decorative = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting)
      },
      { rootMargin: '900px 0px' },
    )
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={hostRef} className={`lazy-mascot ${className}`.trim()}>
      {visible ? (
        <LevelMascot
          mascot={mascot}
          mood={mood}
          quality={quality}
          ariaLabel={ariaLabel}
          decorative={decorative}
        />
      ) : null}
    </div>
  )
}
