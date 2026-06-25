import React from 'react'

/* ---------------- Status Chip / Badge ---------------- */
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-[rgba(var(--surface-3-rgb),0.9)] text-theme-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-accent',
}

export const StatusChip: React.FC<{
  tone?: Tone
  dot?: boolean
  children: React.ReactNode
  className?: string
}> = ({ tone = 'neutral', dot = false, children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
)

export const Badge = StatusChip

/* ---------------- Notification Badge (count bubble) ---------------- */
export const NotificationBadge: React.FC<{ count: number; className?: string }> = ({
  count,
  className = '',
}) => {
  if (count <= 0) return null
  return (
    <span
      className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-[var(--surface)] ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/* ---------------- Progress Bar ---------------- */
export const ProgressBar: React.FC<{
  value: number
  max?: number
  tone?: Tone
  showLabel?: boolean
  className?: string
}> = ({ value, max = 100, tone = 'accent', showLabel = false, className = '' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const barColor =
    tone === 'success'
      ? 'bg-success'
      : tone === 'warning'
      ? 'bg-warning'
      : tone === 'danger'
      ? 'bg-danger'
      : tone === 'info'
      ? 'bg-info'
      : 'bg-accent'
  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(var(--surface-rgb),0.8)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <p className="mt-1 text-xs text-theme-muted">{Math.round(pct)}%</p>}
    </div>
  )
}

/* ---------------- Avatar ---------------- */
export const Avatar: React.FC<{
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ name = '', src, size = 'md', className = '' }) => {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' }
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return src ? (
    <img
      src={src || "/placeholder.svg"}
      alt={name}
      className={`${sizes[size]} rounded-full object-cover ${className}`}
    />
  ) : (
    <span
      className={`flex items-center justify-center rounded-full bg-accent-soft font-bold text-accent ${sizes[size]} ${className}`}
    >
      {initials || '?'}
    </span>
  )
}

/* ---------------- Loading Skeleton ---------------- */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`ss-skeleton rounded-xl ${className}`} />
)

/* ---------------- Empty State ---------------- */
export const EmptyState: React.FC<{
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}> = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed surface-border px-6 py-12 text-center ${className}`}>
    {icon && (
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        {icon}
      </div>
    )}
    <h3 className="type-card-title">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-theme-secondary">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

/* ---------------- Spinner ---------------- */
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    className={`ss-spin ${className}`}
    style={{ width: size, height: size }}
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Loading"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)
