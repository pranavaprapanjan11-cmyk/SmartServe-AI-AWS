import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-[var(--surface)] font-semibold hover:brightness-110 active:brightness-95 shadow-soft',
  secondary:
    'bg-accent-soft text-accent font-semibold border border-[rgba(var(--accent-rgb),0.25)] hover:bg-[rgba(var(--accent-rgb),0.2)]',
  danger:
    'bg-danger-soft text-danger font-semibold border border-[rgba(var(--danger-rgb),0.3)] hover:bg-[rgba(var(--danger-rgb),0.22)]',
  outline:
    'border surface-border text-theme-primary font-medium hover:bg-[rgba(var(--surface-3-rgb),0.6)]',
  ghost:
    'text-theme-secondary font-medium hover:bg-[rgba(var(--surface-3-rgb),0.5)] hover:text-theme-primary',
}

const Spinner: React.FC = () => (
  <svg className="ss-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth,
  className = '',
  children,
  disabled,
  ...rest
}) => {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`focus-ring inline-flex items-center justify-center rounded-2xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

export default Button
