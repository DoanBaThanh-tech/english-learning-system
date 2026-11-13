import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  affix?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  icon,
  affix,
  className = '',
  id,
  type = 'text',
  ...rest
}: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const actualType = isPassword && show ? 'text' : type

  return (
    <div className={`field${error ? ' is-invalid' : ''}`}>
      {label ? <label htmlFor={inputId}>{label}</label> : null}
      <div className="field__wrap">
        {icon}
        <input
          id={inputId}
          className={`input ${className}`.trim()}
          type={actualType}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            className="input-affix"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {show ? <EyeOff /> : <Eye />}
          </button>
        ) : (
          affix
        )}
      </div>
      {error ? (
        <span className="field__hint is-error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  )
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7c.45-.1.9-.2 1.4-.2 5.9 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.5" />
      <path d="M6.3 6.8A17 17 0 0 0 2.5 12S6.1 18.5 12 18.5c1.8 0 3.4-.6 4.8-1.4" />
    </svg>
  )
}
