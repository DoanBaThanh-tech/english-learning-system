import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  tone?: 'default' | 'gold' | 'ok' | 'bad' | 'warn' | 'line'
  icon?: ReactNode
  className?: string
}

export function Chip({ children, tone = 'default', icon, className = '' }: Props) {
  const toneClass =
    tone === 'default' ? '' : ` chip--${tone}`
  return (
    <span className={`chip${toneClass} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  )
}
