type Item = { id: string; label: string; count?: number }

type Props = {
  items: Item[]
  value: string
  onChange: (id: string) => void
  ariaLabel: string
}

export function Tabs({ items, value, onChange, ariaLabel }: Props) {
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`tab${value === item.id ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {typeof item.count === 'number' ? ` · ${item.count}` : ''}
        </button>
      ))}
    </div>
  )
}
