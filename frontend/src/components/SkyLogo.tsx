import { Link } from 'react-router-dom'

type Props = {
  to?: string
  compact?: boolean
  className?: string
}

export function SkyLogo({ to = '/', compact = false, className = '' }: Props) {
  const content = (
    <>
      <span className="sky-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 44 32" width="44" height="32" fill="none">
          <path
            d="M11.4 27.5h21.7c5 0 8.9-3.6 8.9-8.1 0-4.3-3.4-7.8-7.9-8.1C32.6 6.2 28.2 3 22.9 3c-5.6 0-10.2 3.8-11.6 9C7.3 12.4 4 15.4 4 19.2c0 4.6 3.3 8.3 7.4 8.3Z"
            fill="#3b8fd0"
          />
          <path
            d="M12.2 24.7h20.5c3.4 0 6.1-2.4 6.1-5.5 0-3-2.5-5.4-5.7-5.5-.6 0-1.1.1-1.6.2l-1.2.3-.5-1.2C28.6 9.1 25.8 7 22.7 7c-4 0-7.4 2.8-8.3 6.7l-.3 1.4h-1.4c-2.5 0-4.5 1.7-4.5 3.9 0 2.8 2 5.7 4 5.7Z"
            fill="#e3f3fc"
          />
          <circle cx="17" cy="17.4" r="1.5" fill="#1d4468" />
          <circle cx="26" cy="17.4" r="1.5" fill="#1d4468" />
          <path d="M19.2 21.4c1.5 1.2 3.6 1.2 5.1 0" stroke="#1d4468" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="14.2" cy="20.4" r="1.4" fill="#f2b4bf" opacity=".85" />
          <circle cx="28.9" cy="20.4" r="1.4" fill="#f2b4bf" opacity=".85" />
        </svg>
      </span>
      {!compact ? (
        <span className="sky-logo__word">
          skyworld
          <em>English</em>
        </span>
      ) : null}
    </>
  )

  return (
    <Link to={to} className={`sky-logo ${className}`.trim()} aria-label="SkyWorld - trang chủ">
      {content}
    </Link>
  )
}
