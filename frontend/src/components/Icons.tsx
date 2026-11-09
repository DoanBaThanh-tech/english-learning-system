type IconProps = {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export function MailIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function LockIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4.5" y="10" width="15" height="10" rx="3" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2.5" />
    </svg>
  )
}

export function UserIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.7-3.4 3.4-5.2 7-5.2s6.3 1.8 7 5.2" />
    </svg>
  )
}

export function EyeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  )
}

export function EyeOffIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m4 4 16 16" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 4.9c6 0 9.5 5.5 9.5 5.5a17 17 0 0 1-2.7 3.3" />
      <path d="M6.1 7.2A17 17 0 0 0 2.5 12S6 17.5 12 17.5a10.9 10.9 0 0 0 4.4-.9" />
      <path d="M10 10a2.8 2.8 0 0 0 4 4" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  )
}

export function SparkIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6-5.5-1.7L10.3 9 12 3.5Z" />
    </svg>
  )
}

export function CheckIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2.4}>
      <path d="m5 12.5 4.3 4.3L19 7.5" />
    </svg>
  )
}

export function GraduationIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m3 9.5 9-4.5 9 4.5-9 4.5-9-4.5Z" />
      <path d="M6.5 11.4v4.1c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-4.1" />
      <path d="M21 9.5v5" />
    </svg>
  )
}

export function TargetIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CalendarIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="5.5" width="16" height="15" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 9.5h16" />
    </svg>
  )
}

export function LayersIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m12 3.5 8.5 4.6L12 12.7 3.5 8.1 12 3.5Z" />
      <path d="m4 12.2 8 4.3 8-4.3" />
      <path d="m4 16.3 8 4.3 8-4.3" />
    </svg>
  )
}

export function BookmarkIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6.5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v14l-7-4.4L5 20V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M9 8.5h6" />
    </svg>
  )
}

export function MicIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3M9 21h6" />
    </svg>
  )
}

export function ChatIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20 11.5a6.5 6.5 0 0 1-6.5 6.5H9.2L5 21v-4.1A6.5 6.5 0 0 1 7 4.9h6.5A6.5 6.5 0 0 1 20 11.5Z" />
      <path d="M8.5 10.2h7M8.5 13.2h4.5" />
    </svg>
  )
}

export function BookIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 5.5c2.9-1 5.4-.4 7.5 1v13c-2.1-1.4-4.6-2-7.5-1v-13Z" />
      <path d="M19.5 5.5c-2.9-1-5.4-.4-7.5 1v13c2.1-1.4 4.6-2 7.5-1v-13Z" />
      <path d="M7.5 9.2c.9-.1 1.7 0 2.5.4M7.5 12.4c.9-.1 1.7 0 2.5.4" />
    </svg>
  )
}

export function ChartIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 20h16" />
      <rect x="5.5" y="12" width="3.2" height="5.5" rx="1.1" />
      <rect x="10.4" y="8" width="3.2" height="9.5" rx="1.1" />
      <rect x="15.3" y="4.5" width="3.2" height="13" rx="1.1" />
    </svg>
  )
}

export function CloseIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function LogoutIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.5 8V6.5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V16" />
      <path d="M10 12h10.5" />
      <path d="m17 8.5 3.5 3.5L17 15.5" />
    </svg>
  )
}
