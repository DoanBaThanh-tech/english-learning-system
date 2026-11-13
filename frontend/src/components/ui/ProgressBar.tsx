type Props = {
  value: number
  max?: number
  gold?: boolean
  slim?: boolean
  label?: string
}

export function ProgressBar({ value, max = 100, gold = false, slim = false, label }: Props) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className={`progress${gold ? ' progress--gold' : ''}${slim ? ' progress--slim' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label ?? 'Tiến độ'}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}
