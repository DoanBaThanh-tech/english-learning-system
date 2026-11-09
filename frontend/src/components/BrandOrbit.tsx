import type { CSSProperties } from 'react'

type BrandOrbitProps = {
  size?: number
  className?: string
}

export function BrandOrbit({ size = 64, className = '' }: BrandOrbitProps) {
  return (
    <span
      className={`orbit ${className}`.trim()}
      style={{ '--orbit-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="orbit__glow" />
      <span className="orbit__ring orbit__ring--a" />
      <span className="orbit__ring orbit__ring--b" />
      <span className="orbit__core">
        <span className="orbit__shine" />
      </span>
      <span className="orbit__satellite">
        <span className="orbit__moon" />
      </span>
    </span>
  )
}
