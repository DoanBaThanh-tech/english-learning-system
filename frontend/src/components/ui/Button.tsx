import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost'
  size?: 'md' | 'sm'
  block?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  className = '',
  children,
  type = 'button',
  ...rest
}: Props) {
  const classes = [
    'btn',
    variant === 'secondary' ? 'btn--sec' : '',
    variant === 'gold' ? 'btn--gold' : '',
    variant === 'ghost' ? 'btn--ghost' : '',
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      {children}
    </button>
  )
}
