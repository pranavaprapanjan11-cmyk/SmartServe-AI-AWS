"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative mb-4">
        {/* Soft breathing halo behind the icon */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl"
          animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.12, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-soft">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <h3 className="text-balance font-serif text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
