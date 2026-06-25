import React from 'react'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

export const Breadcrumb: React.FC<{ items: Crumb[]; className?: string }> = ({
  items,
  className = '',
}) => (
  <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs font-semibold ${className}`}>
    {items.map((item, idx) => {
      const last = idx === items.length - 1
      return (
        <React.Fragment key={`${item.label}-${idx}`}>
          {idx > 0 && <span className="text-theme-muted">/</span>}
          {item.to && !last ? (
            <Link to={item.to} className="text-theme-secondary transition hover:text-theme-primary">
              {item.label}
            </Link>
          ) : (
            <span className={last ? 'text-accent' : 'text-theme-secondary'}>{item.label}</span>
          )}
        </React.Fragment>
      )
    })}
  </nav>
)

export default Breadcrumb
