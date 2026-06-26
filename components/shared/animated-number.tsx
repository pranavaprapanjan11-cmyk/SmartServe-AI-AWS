"use client"

import { useCountUp } from "@/lib/use-count-up"

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1100,
  format = true,
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  format?: boolean
  className?: string
}) {
  const animated = useCountUp(value, { duration })
  const rounded = Number(animated.toFixed(decimals))
  const display = format
    ? rounded.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : rounded.toFixed(decimals)

  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
