import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'article' | 'section' | 'aside'
  flat?: boolean
  sky?: boolean
  children: ReactNode
}

export function Card({
  as: Tag = 'div',
  flat = false,
  sky = false,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <Tag
      className={`card${flat ? ' card--flat' : ''}${sky ? ' card--sky' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  )
}
