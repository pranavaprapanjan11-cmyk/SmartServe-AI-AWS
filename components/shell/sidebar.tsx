"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ChefHat, ChevronsUpDown, Check } from "lucide-react"
import { navSections } from "@/lib/navigation"
import { restaurants } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { LivePulse } from "@/components/shared/live-pulse"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [activeRestaurant, setActiveRestaurant] = useState(restaurants[0])

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-accent text-background">
          <span className="absolute inset-0 rounded-xl bg-sidebar-accent/40 blur-md animate-breathe" aria-hidden />
          <ChefHat className="relative h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-serif text-base font-semibold text-background">SmartServe</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Enterprise OS</p>
        </div>
      </div>

      <div className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-border/30 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-copper text-copper-foreground text-xs font-semibold">
              {activeRestaurant.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-background">{activeRestaurant.name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{activeRestaurant.location}</p>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuLabel>Switch restaurant</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {restaurants.map((r) => (
              <DropdownMenuItem key={r.id} onClick={() => setActiveRestaurant(r)}>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                  {r.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{r.location}</p>
                </div>
                {r.id === activeRestaurant.id && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "text-background"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-border/40 hover:text-background"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        layout="position"
                        className="absolute inset-0 rounded-lg bg-sidebar-accent/90"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <item.icon className="relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
                    <span className="relative z-10 flex-1 font-medium">{item.title}</span>
                    {item.badge && (
                      <Badge
                        variant={active ? "secondary" : "copper"}
                        className="relative z-10 h-5 min-w-5 justify-center px-1.5 text-[10px]"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-xl bg-gradient-to-br from-sidebar-accent/20 to-copper/10 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-background">Restaurant Pulse</p>
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sidebar-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sidebar-accent" />
              </span>
              Live
            </span>
          </div>
          <div className="mt-1 flex items-end gap-2">
            <AnimatedNumber
              value={94}
              duration={1500}
              className="font-serif text-2xl font-semibold text-sidebar-accent"
            />
            <span className="pb-1 text-[11px] text-sidebar-foreground/60">Excellent · all systems nominal</span>
          </div>
          <LivePulse className="mt-1.5 h-8 w-full text-sidebar-accent" />
        </div>
      </div>
    </div>
  )
}
