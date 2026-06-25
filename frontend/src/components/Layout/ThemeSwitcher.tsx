import React, { useMemo, useState } from 'react'
import { ThemeKey, themeOptions, useTheme } from '../../context/ThemeContext'

const themeSwatches: Record<ThemeKey, { primary: string; accent: string }> = {
  'obsidian-midnight': { primary: '#070a13', accent: '#38bdf8' },
  'arctic-light': { primary: '#f8fbff', accent: '#0ea5e9' },
  'neon-cyber': { primary: '#020617', accent: '#22d3ee' },
  'emerald-pro': { primary: '#021d12', accent: '#34d399' },
  'sunset-amber': { primary: '#1a1206', accent: '#f97316' },
  'crimson-command': { primary: '#2b0a10', accent: '#f43f5e' },
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
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2a7 7 0 0 1 7 7 7 7 0 1 1-7-7Z" fill="currentColor" />
          <path d="M12 2v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-[1.5rem] border surface-border bg-surface-panel shadow-2xl shadow-black/35">
          <div className="grid gap-1 p-2">
            {themeOptions.map((option) => {
              const active = option.key === theme
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
                      ? 'bg-cyan-500/15 text-cyan-100'
                      : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span>{option.label}</span>
                  {active && <span className="rounded-full bg-cyan-500/20 px-2 text-xs text-cyan-100">On</span>}
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
