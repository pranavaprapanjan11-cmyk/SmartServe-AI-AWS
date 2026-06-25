import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padded?: boolean
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  padded = true,
  className = '',
  children,
  ...rest
}) => (
  <div
    {...rest}
    className={`surface-card shadow-soft ${padded ? 'p-5 sm:p-6' : ''} ${
      hoverable ? 'transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-0.5' : ''
    } ${className}`}
  >
    {children}
  </div>
)

export const CardHeader: React.FC<{
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`mb-4 flex items-start justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      <h3 className="type-card-title truncate">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-theme-secondary">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
)

type Trend = 'up' | 'down' | 'flat'

export interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  delta?: string
  trend?: Trend
  accent?: 'emerald' | 'copper' | 'info' | 'danger'
  className?: string
}

const accentMap = {
  emerald: 'text-accent bg-accent-soft',
  copper: 'text-accent-2 bg-accent-2-soft',
  info: 'text-info bg-info-soft',
  danger: 'text-danger bg-danger-soft',
}

const trendMap: Record<Trend, string> = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-theme-secondary',
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  delta,
  trend = 'flat',
  accent = 'emerald',
  className = '',
}) => (
  <Card className={className}>
    <div className="flex items-start justify-between gap-3">
      <p className="type-label">{label}</p>
      {icon && (
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          {icon}
        </span>
      )}
    </div>
    <p className="mt-3 font-display text-3xl font-semibold text-theme-primary">{value}</p>
    {delta && (
      <p className={`mt-1.5 text-xs font-semibold ${trendMap[trend]}`}>
        {trend === 'up' ? '▲ ' : trend === 'down' ? '▼ ' : ''}
        {delta}
      </p>
    )}
  </Card>
)

export const ChartCard: React.FC<{
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}> = ({ title, subtitle, action, children, className = '' }) => (
  <Card className={className}>
    <CardHeader title={title} subtitle={subtitle} action={action} />
    <div className="mt-2">{children}</div>
  </Card>
)

export default Card
