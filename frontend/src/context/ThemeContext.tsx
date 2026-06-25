import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeKey =
  | 'graphite-emerald'
  | 'ivory-warm'
  | 'espresso-gold'
  | 'sage-linen'
  | 'copper-noir'
  | 'midnight-charcoal'

export const themeOptions: { key: ThemeKey; label: string }[] = [
  { key: 'graphite-emerald', label: 'Graphite Emerald' },
  { key: 'ivory-warm', label: 'Ivory Warm' },
  { key: 'espresso-gold', label: 'Espresso Gold' },
  { key: 'sage-linen', label: 'Sage Linen' },
  { key: 'copper-noir', label: 'Copper Noir' },
  { key: 'midnight-charcoal', label: 'Midnight Charcoal' },
]

const STORAGE_KEY = 'smartserve-appearance'

interface ThemeContextValue {
  theme: ThemeKey
  setTheme: (theme: ThemeKey) => void
  compactMode: boolean
  setCompactMode: (value: boolean) => void
  highContrast: boolean
  setHighContrast: (value: boolean) => void
  animationsEnabled: boolean
  setAnimationsEnabled: (value: boolean) => void
  themes: typeof themeOptions
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeKey>('graphite-emerald')
  const [compactMode, setCompactModeState] = useState(false)
  const [highContrast, setHighContrastState] = useState(false)
  const [animationsEnabled, setAnimationsEnabledState] = useState(true)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as {
        theme?: ThemeKey
        compactMode?: boolean
        highContrast?: boolean
        animationsEnabled?: boolean
      }

      if (parsed.theme && themeOptions.some((option) => option.key === parsed.theme)) {
        setThemeState(parsed.theme)
      }
      if (typeof parsed.compactMode === 'boolean') {
        setCompactModeState(parsed.compactMode)
      }
      if (typeof parsed.highContrast === 'boolean') {
        setHighContrastState(parsed.highContrast)
      }
      if (typeof parsed.animationsEnabled === 'boolean') {
        setAnimationsEnabledState(parsed.animationsEnabled)
      }
    } catch {
      // ignore invalid storage value
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme, compactMode, highContrast, animationsEnabled })
    )
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.dataset.compactMode = compactMode ? 'true' : 'false'
    document.documentElement.dataset.highContrast = highContrast ? 'true' : 'false'
    document.documentElement.dataset.animationsEnabled = animationsEnabled ? 'true' : 'false'
  }, [theme, compactMode, highContrast, animationsEnabled])

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      compactMode,
      setCompactMode: setCompactModeState,
      highContrast,
      setHighContrast: setHighContrastState,
      animationsEnabled,
      setAnimationsEnabled: setAnimationsEnabledState,
      themes: themeOptions,
    }),
    [theme, compactMode, highContrast, animationsEnabled]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
