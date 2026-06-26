"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// One seamless heartbeat tile — starts and ends on the baseline (y=20) at x=0 and x=100
// so copies can be laid end-to-end and scrolled infinitely without a visible seam.
const TILE =
  "M0 20 H30 L36 20 L40 6 L44 34 L48 12 L52 20 H70 L74 16 L78 24 L80 20 H100"

/**
 * LivePulse renders a continuously scrolling EKG-style heartbeat line.
 * It reads its stroke color from the current text color, so wrap it in a
 * `text-*` class (e.g. text-sidebar-accent) to theme it.
 */
export function LivePulse({
  className,
  speed = 3.2,
  strokeWidth = 2,
}: {
  className?: string
  speed?: number
  strokeWidth?: number
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        // Fade both edges so the line emerges and dissolves like a monitor trace.
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
      aria-hidden
    >
      <motion.div
        className="flex h-full w-[200%]"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
      >
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-1/2">
            <path
              d={TILE}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ))}
      </motion.div>
    </div>
  )
}
