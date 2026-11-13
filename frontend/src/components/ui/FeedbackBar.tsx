import type { ReactNode } from 'react'

type Props = {
  tone: 'ok' | 'bad' | 'warn' | 'info'
  title?: string
  children: ReactNode
  action?: ReactNode
}

export function FeedbackBar({ tone, title, children, action }: Props) {
  return (
    <div className={`feedback feedback--${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <div style={{ flex: 1 }}>
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
      {action}
    </div>
  )
}
