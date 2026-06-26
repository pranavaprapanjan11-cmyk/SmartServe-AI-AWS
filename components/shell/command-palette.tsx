"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Clock,
  Sparkles,
  Plus,
  CalendarPlus,
  Boxes,
  Sun,
  Moon,
  ChefHat,
  ClipboardList,
  Receipt,
  Grid3x3,
  Users,
  type LucideIcon,
} from "lucide-react"
import { navSections } from "@/lib/navigation"
import { orders, tables, reservations, customers, menuItems } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  group: string
  label: string
  sublabel?: string
  icon: LucideIcon
  keywords: string
  run: () => void
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>(["Command Center", "Order #2841", "Inventory"])
  const listRef = useRef<HTMLDivElement>(null)

  const go = (href: string) => () => {
    router.push(href)
    onClose()
  }

  const items = useMemo<CommandItem[]>(() => {
    const quickActions: CommandItem[] = [
      {
        id: "qa-order",
        group: "Quick Actions",
        label: "Create new order",
        sublabel: "Open a fresh ticket",
        icon: Plus,
        keywords: "new order create ticket pos",
        run: () => {
          router.push("/orders")
          onClose()
          toast.success("New order started", { description: "Ticket opened — add items to begin." })
        },
      },
      {
        id: "qa-reservation",
        group: "Quick Actions",
        label: "New reservation",
        sublabel: "Book a table",
        icon: CalendarPlus,
        keywords: "reservation book table guest",
        run: () => {
          router.push("/reservations")
          onClose()
          toast.success("Reservation drafted", { description: "Pick a time and party size to confirm." })
        },
      },
      {
        id: "qa-inventory",
        group: "Quick Actions",
        label: "Add inventory item",
        sublabel: "Stock a new ingredient",
        icon: Boxes,
        keywords: "inventory stock ingredient add supply",
        run: () => {
          router.push("/inventory")
          onClose()
          toast.success("Inventory item ready", { description: "Fill in quantity and par level." })
        },
      },
      {
        id: "qa-kitchen",
        group: "Quick Actions",
        label: "Open Kitchen Display",
        sublabel: "Jump to the line",
        icon: ChefHat,
        keywords: "kitchen display kds line tickets",
        run: go("/kitchen"),
      },
      {
        id: "qa-theme",
        group: "Quick Actions",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        sublabel: "Toggle appearance",
        icon: theme === "dark" ? Sun : Moon,
        keywords: "theme dark light mode appearance toggle",
        run: () => {
          setTheme(theme === "dark" ? "light" : "dark")
          toast(theme === "dark" ? "Light mode on" : "Dark mode on")
        },
      },
    ]

    const navItems: CommandItem[] = navSections.flatMap((s) =>
      s.items.map((item) => ({
        id: `nav-${item.href}`,
        group: "Navigation",
        label: item.title,
        sublabel: s.label,
        icon: item.icon,
        keywords: `${item.title} ${s.label} ${item.href}`,
        run: go(item.href),
      })),
    )

    const orderItems: CommandItem[] = orders.map((o) => ({
      id: `order-${o.id}`,
      group: "Orders",
      label: `Order #${o.id}`,
      sublabel: `${o.table} · ${o.server} · ₹${o.total.toLocaleString("en-IN")} · ${o.status}`,
      icon: ClipboardList,
      keywords: `order ${o.id} ${o.table} ${o.server} ${o.status}`,
      run: go("/orders"),
    }))

    const tableItems: CommandItem[] = tables.map((t) => ({
      id: `table-${t.id}`,
      group: "Tables",
      label: `Table ${t.number}`,
      sublabel: `${t.seats} seats · ${t.status}${t.server ? ` · ${t.server}` : ""}`,
      icon: Grid3x3,
      keywords: `table ${t.number} ${t.status} ${t.server ?? ""}`,
      run: go("/tables"),
    }))

    const reservationItems: CommandItem[] = reservations.map((r) => ({
      id: `res-${r.id}`,
      group: "Reservations",
      label: r.name,
      sublabel: `${r.guests} guests · ${r.time} · ${r.status}`,
      icon: CalendarPlus,
      keywords: `reservation ${r.name} ${r.time} ${r.status}`,
      run: go("/reservations"),
    }))

    const customerItems: CommandItem[] = customers.map((c) => ({
      id: `cust-${c.id}`,
      group: "Customers",
      label: c.name,
      sublabel: `${c.loyaltyTier} · ${c.visits} visits · ₹${c.totalSpent.toLocaleString("en-IN")}`,
      icon: Users,
      keywords: `customer ${c.name} ${c.loyaltyTier} ${c.email}`,
      run: go("/crm"),
    }))

    const menuItemsList: CommandItem[] = menuItems.map((m) => ({
      id: `menu-${m.id}`,
      group: "Menu",
      label: m.name,
      sublabel: `${m.category} · ₹${m.price}${m.available ? "" : " · 86'd"}`,
      icon: Receipt,
      keywords: `menu ${m.name} ${m.category}`,
      run: go("/billing"),
    }))

    return [
      ...quickActions,
      ...navItems,
      ...orderItems,
      ...tableItems,
      ...reservationItems,
      ...customerItems,
      ...menuItemsList,
    ]
  }, [router, theme, setTheme]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // No query: surface quick actions + navigation only for a clean default.
      return items.filter((i) => i.group === "Quick Actions" || i.group === "Navigation")
    }
    return items.filter((i) => (i.label + " " + i.keywords).toLowerCase().includes(q))
  }, [items, query])

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      if (!map.has(item.group)) map.set(item.group, [])
      map.get(item.group)!.push(item)
    }
    return Array.from(map.entries())
  }, [filtered])

  // Reset state each time the palette opens.
  useEffect(() => {
    if (open) {
      setQuery("")
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  // Keep the active item scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [active])

  function select(item: CommandItem) {
    setRecent((r) => [item.label, ...r.filter((x) => x !== item.label)].slice(0, 4))
    item.run()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = filtered[active]
      if (item) select(item)
    } else if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Search bar */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search orders, tables, customers, menu — or run an action..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Recents (shown only on empty query) */}
            {!query && recent.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" /> Recent
                </span>
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuery(r)}
                    className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Results */}
            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No matches for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-muted-foreground">Try an order number, table, customer, or dish name.</p>
                </div>
              ) : (
                grouped.map(([group, groupItems]) => (
                  <div key={group} className="mb-1.5 last:mb-0">
                    <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {group}
                    </p>
                    {groupItems.map((item) => {
                      const index = filtered.indexOf(item)
                      const isActive = index === active
                      return (
                        <button
                          key={item.id}
                          data-index={index}
                          onMouseMove={() => setActive(index)}
                          onClick={() => select(item)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                            isActive ? "bg-primary/10 text-foreground" : "text-foreground/90 hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{item.label}</span>
                            {item.sublabel && (
                              <span className="block truncate text-xs text-muted-foreground">{item.sublabel}</span>
                            )}
                          </span>
                          {isActive && (
                            <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="flex h-4 w-4 items-center justify-center rounded border border-border bg-card">
                    <ArrowUp className="h-2.5 w-2.5" />
                  </kbd>
                  <kbd className="flex h-4 w-4 items-center justify-center rounded border border-border bg-card">
                    <ArrowDown className="h-2.5 w-2.5" />
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="flex h-4 items-center justify-center rounded border border-border bg-card px-1">
                    <CornerDownLeft className="h-2.5 w-2.5" />
                  </kbd>
                  select
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                SmartServe Command
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
