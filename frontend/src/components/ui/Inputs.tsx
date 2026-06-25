import React from 'react'

const fieldBase =
  'w-full rounded-2xl border surface-border bg-[rgba(var(--surface-rgb),0.6)] px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted transition-all duration-200 focus-ring focus:border-[rgba(var(--accent-rgb),0.5)]'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  leftIcon,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-theme-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          {...rest}
          className={`${fieldBase} ${leftIcon ? 'pl-10' : ''} ${
            error ? 'border-[rgba(var(--danger-rgb),0.6)]' : ''
          } ${className}`}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-theme-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', id, ...rest }) => {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-theme-secondary">
          {label}
        </label>
      )}
      <textarea id={inputId} {...rest} className={`${fieldBase} min-h-[96px] resize-y ${className}`} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', id, ...rest }) => {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-theme-secondary">
          {label}
        </label>
      )}
      <select id={inputId} {...rest} className={`${fieldBase} appearance-none ${className}`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClear, className = '', value, ...rest }) => (
  <div className={`relative ${className}`}>
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </span>
    <input
      {...rest}
      value={value}
      className={`${fieldBase} pl-10 ${value ? 'pr-10' : ''}`}
      placeholder={rest.placeholder || 'Search...'}
    />
    {value && onClear && (
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear search"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
)
