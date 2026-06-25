import React, { useMemo, useState } from 'react'
import { ThemeKey, themeOptions, useTheme } from '../../context/ThemeContext'

const themeSwatches: Record<ThemeKey, { primary: string; accent: string }> = {
  'graphite-emerald': { primary: '#16140f', accent: '#2fae74' },
  'ivory-warm': { primary: '#f7f3ec', accent: '#1f8d5c' },
  'espresso-gold': { primary: '#1a1410', accent: '#d8a23a' },
  'sage-linen': { primary: '#eef1e9', accent: '#2f8f5e' },
  'copper-noir': { primary: '#131210', accent: '#c98a4b' },
  'midnight-charcoal': { primary: '#121315', accent: '#34b483' },
}

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const currentTheme = useMemo(
    () => themeOptions.find((option) => option.key === theme),
    [theme]
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open theme selector"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border surface-border surface-panel text-theme-secondary transition hover:text-theme-primary"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2a7 7 0 0 1 7 7 7 7 0 1 1-7-7Z" fill="currentColor" />
          <path d="M12 2v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[1.5rem] border surface-border surface-panel-strong shadow-soft-lg backdrop-blur-xl">
          <div className="border-b surface-border px-4 py-2.5">
            <p className="text-3xs font-bold uppercase tracking-widest text-theme-muted">Appearance</p>
          </div>
          <div className="grid gap-1 p-2">
            {themeOptions.map((option) => {
              const active = option.key === theme
              const swatch = themeSwatches[option.key]
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setTheme(option.key)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                    active
                      ? 'bg-accent-soft text-accent'
                      : 'text-theme-secondary hover:bg-[rgba(var(--surface-3-rgb),0.6)] hover:text-theme-primary'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full border surface-border"
                      style={{ backgroundColor: swatch.primary }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: swatch.accent }} />
                    </span>
                    {option.label}
                  </span>
                  {active && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-2xs text-accent">On</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
