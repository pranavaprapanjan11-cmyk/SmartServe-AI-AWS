"use client"

import { useEffect, useRef, useState } from "react"

// easeOutExpo — fast start, gentle settle. Feels alive without being slow.
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * Animates a number from 0 (or `from`) to `target` once the value is known.
 * Respects prefers-reduced-motion by jumping straight to the target.
 */
export function useCountUp(target: number, { duration = 1100, from = 0 }: { duration?: number; from?: number } = {}) {
  const [value, setValue] = useState(from)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setValue(target)
      return
    }

    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setValue(from + (target - from) * easeOutExpo(progress))
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate)
      }
    }
    frame.current = requestAnimationFrame(animate)

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, duration, from])

  return value
}
