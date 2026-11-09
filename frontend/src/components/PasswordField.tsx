import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { EyeIcon, EyeOffIcon, LockIcon } from './Icons'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  hint?: string
  invalid?: boolean
  disabled?: boolean
  maxLength?: number
  autoFocus?: boolean
  onKeyUp?: (event: KeyboardEvent<HTMLInputElement>) => void
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Tối thiểu 8 ký tự',
  autoComplete = 'current-password',
  hint,
  invalid = false,
  disabled = false,
  maxLength,
  autoFocus = false,
  onKeyUp,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">{label}</span>
      <span className={`field__control${invalid ? ' is-invalid' : ''}`}>
        <LockIcon size={19} className="field__icon" />
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          onKeyUp={onKeyUp}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={invalid}
        />
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          tabIndex={0}
        >
          {visible ? <EyeOffIcon size={19} /> : <EyeIcon size={19} />}
        </button>
      </span>
      {hint ? (
        <span className={`field__hint${invalid ? ' is-error' : ''}`}>{hint}</span>
      ) : null}
    </label>
  )
}
