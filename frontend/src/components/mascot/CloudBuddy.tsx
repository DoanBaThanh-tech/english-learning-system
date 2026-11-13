import { useId } from 'react'
import type { CloudFriendId } from '../../lib/curriculum'
import './cloud-buddy.css'

type BuddyTone = {
  name: string
  role: string
  top: string
  bottom: string
  accent: string
  ink: string
  accessory: 'none' | 'bow' | 'star' | 'scarf' | 'headphones' | 'glasses'
}

export const CLOUD_FRIENDS: Record<CloudFriendId, BuddyTone> = {
  nimbo: {
    name: 'Nimbo',
    role: 'Bạn mây dẫn đường',
    top: '#f4fbff',
    bottom: '#b9d8f0',
    accent: '#3b8fd0',
    ink: '#1d4468',
    accessory: 'none',
  },
  pip: {
    name: 'Pip',
    role: 'Bạn mây trắc nghiệm',
    top: '#fff0f6',
    bottom: '#f4b9cd',
    accent: '#d95d8a',
    ink: '#5b2340',
    accessory: 'bow',
  },
  lumi: {
    name: 'Lumi',
    role: 'Bạn mây xếp câu',
    top: '#fff9e6',
    bottom: '#f6d77a',
    accent: '#c9a43b',
    ink: '#5a4107',
    accessory: 'star',
  },
  misty: {
    name: 'Misty',
    role: 'Bạn mây ghép cặp',
    top: '#effcf6',
    bottom: '#a7e0c8',
    accent: '#3aa87c',
    ink: '#17493a',
    accessory: 'scarf',
  },
  bibi: {
    name: 'Bibi',
    role: 'Bạn mây nghe hiểu',
    top: '#f5f0ff',
    bottom: '#c6b6f2',
    accent: '#7a63c9',
    ink: '#33245c',
    accessory: 'headphones',
  },
  coco: {
    name: 'Coco',
    role: 'Bạn mây điền từ',
    top: '#fff1e9',
    bottom: '#f6b393',
    accent: '#d9774a',
    ink: '#4c2517',
    accessory: 'glasses',
  },
}

type BuddyPose = 'idle' | 'cheer' | 'think' | 'sad'

type Props = {
  friend: CloudFriendId
  size?: number
  pose?: BuddyPose
  className?: string
  decorative?: boolean
}

export function CloudBuddy({
  friend,
  size = 96,
  pose = 'idle',
  className = '',
  decorative = false,
}: Props) {
  const tone = CLOUD_FRIENDS[friend]
  const rawId = useId()
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const bodyGradient = `buddy-body-${id}`
  const shineGradient = `buddy-shine-${id}`
  const happy = pose === 'cheer'
  const sad = pose === 'sad'
  const think = pose === 'think'

  return (
    <svg
      className={`cloud-buddy cloud-buddy--${friend} is-${pose} ${className}`.trim()}
      width={size}
      height={(size / 140) * 132}
      viewBox="0 0 140 132"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : `${tone.name}, ${tone.role.toLowerCase()}`}
    >
      {!decorative ? <title>{`${tone.name} — ${tone.role}`}</title> : null}
      <defs>
        <linearGradient id={bodyGradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.top} />
          <stop offset="100%" stopColor={tone.bottom} />
        </linearGradient>
        <radialGradient id={shineGradient} cx="0.3" cy="0.2" r="0.8">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="buddy__float">
        <ellipse cx="70" cy="122" rx="42" ry="7" fill={tone.ink} opacity="0.12" />

        <g className="buddy__arm buddy__arm--left">
          <rect
            x="8"
            y="82"
            width="19"
            height="26"
            rx="9.5"
            fill={`url(#${bodyGradient})`}
            stroke={tone.accent}
            strokeOpacity="0.22"
            strokeWidth="1.5"
          />
        </g>
        <g className="buddy__arm buddy__arm--right">
          <rect
            x="113"
            y="82"
            width="19"
            height="26"
            rx="9.5"
            fill={`url(#${bodyGradient})`}
            stroke={tone.accent}
            strokeOpacity="0.22"
            strokeWidth="1.5"
          />
        </g>

        <ellipse cx="55" cy="115" rx="14" ry="7" fill={tone.bottom} stroke={tone.accent} strokeOpacity="0.18" />
        <ellipse cx="85" cy="115" rx="14" ry="7" fill={tone.bottom} stroke={tone.accent} strokeOpacity="0.18" />

        <path
          d="M34 99C19 99 7 88 7 73c0-12 8-22 20-25C29 30 44 16 63 16c14 0 26 7 33 18 5-3 11-5 17-5 18 0 32 14 33 31 10 3 17 12 17 23 0 16-13 28-30 28H34Z"
          fill={`url(#${bodyGradient})`}
          stroke={tone.accent}
          strokeOpacity="0.22"
          strokeWidth="2"
        />
        <ellipse cx="48" cy="35" rx="28" ry="16" fill={`url(#${shineGradient})`} />

        <ellipse cx="38" cy="82" rx="8" ry="5" fill={tone.accent} opacity="0.22" />
        <ellipse cx="102" cy="82" rx="8" ry="5" fill={tone.accent} opacity="0.22" />

        {happy ? (
          <>
            <path d="M44 67q7-8 14 0" fill="none" stroke={tone.ink} strokeWidth="4" strokeLinecap="round" />
            <path d="M82 67q7-8 14 0" fill="none" stroke={tone.ink} strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="51" cy="67" rx="7" ry="9" fill="#ffffff" />
            <ellipse cx="89" cy="67" rx="7" ry="9" fill="#ffffff" />
            <g className="buddy__pupils">
              <circle cx={think ? 54 : 52} cy="68" r="4.4" fill={tone.ink} />
              <circle cx="90" cy="68" r="4.4" fill={tone.ink} />
              <circle cx={think ? 55.5 : 53.5} cy="66" r="1.5" fill="#ffffff" />
              <circle cx="91.5" cy="66" r="1.5" fill="#ffffff" />
            </g>
            {sad ? (
              <>
                <path d="M43 55l13 4" stroke={tone.ink} strokeWidth="3" strokeLinecap="round" />
                <path d="M97 55l-13 4" stroke={tone.ink} strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M44 55q7-3 14 0" stroke={tone.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M82 55q7-3 14 0" stroke={tone.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            )}
          </>
        )}

        {sad ? (
          <path d="M62 85q8-6 16 0" fill="none" stroke={tone.ink} strokeWidth="3.4" strokeLinecap="round" />
        ) : think ? (
          <circle cx="70" cy="83" r="4" fill="none" stroke={tone.ink} strokeWidth="3.4" />
        ) : (
          <path
            d={happy ? 'M60 79q10 12 20 0' : 'M63 79q7 8 14 0'}
            fill={happy ? tone.ink : 'none'}
            stroke={tone.ink}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        )}

        {tone.accessory === 'bow' ? (
          <g transform="translate(102 18) rotate(14)">
            <path d="M0 0c-10-9-20 1-10 9 5 4 9 3 10 0 1 3 5 4 10 0 10-8 0-18-10-9Z" fill={tone.accent} />
            <circle cx="0" cy="0" r="3.6" fill={tone.ink} />
          </g>
        ) : null}
        {tone.accessory === 'star' ? (
          <path
            d="M112 12l4.6 9.2 10.2 1.5-7.4 7.2 1.8 10.1-9.2-4.8-9.2 4.8 1.8-10.1-7.4-7.2 10.2-1.5Z"
            fill={tone.accent}
            stroke={tone.ink}
            strokeOpacity="0.2"
          />
        ) : null}
        {tone.accessory === 'scarf' ? (
          <g>
            <path d="M26 90q44 16 88 0l-3 13q-41 14-82 0Z" fill={tone.accent} />
            <path d="M98 102l10 22-10-3-4-17Z" fill={tone.accent} />
          </g>
        ) : null}
        {tone.accessory === 'headphones' ? (
          <g fill="none" stroke={tone.accent} strokeWidth="5" strokeLinecap="round">
            <path d="M24 62c0-28 20-46 46-46s46 18 46 46" />
            <rect x="13" y="59" width="14" height="24" rx="7" fill={tone.accent} stroke="none" />
            <rect x="113" y="59" width="14" height="24" rx="7" fill={tone.accent} stroke="none" />
          </g>
        ) : null}
        {tone.accessory === 'glasses' ? (
          <g fill="none" stroke={tone.ink} strokeWidth="3">
            <circle cx="51" cy="67" r="12" />
            <circle cx="89" cy="67" r="12" />
            <path d="M63 67h14" />
          </g>
        ) : null}
      </g>
    </svg>
  )
}
