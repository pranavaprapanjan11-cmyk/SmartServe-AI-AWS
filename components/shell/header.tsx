"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Menu, Search, Bell, Sun, Moon, ChevronRight, Settings, LogOut, User, Building2 } from "lucide-react"
import { findNavTitle } from "@/lib/navigation"
import { currentUser, notifications } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function Header({ onMenuClick, onSearchClick }: { onMenuClick: () => void; onSearchClick: () => void }) {
  const pathname = usePathname()
  const title = findNavTitle(pathname)
  const { theme, setTheme } = useTheme()
  const unread = notifications.filter((n) => n.unread).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 md:block">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Saffron &amp; Sage</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{title}</span>
        </div>
        <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden lg:block">
          <button
            onClick={onSearchClick}
            className="flex h-9 w-56 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40"
          >
            <Search className="h-4 w-4" />
            <span>Search orders, tables...</span>
            <kbd className="ml-auto rounded border border-border bg-muted px-1.5 text-[10px]">⌘K</kbd>
          </button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onSearchClick} aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="hidden h-5 w-5 dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <motion.span
                animate={unread > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                style={{ transformOrigin: "top center" }}
              >
                <Bell className="h-5 w-5" />
              </motion.span>
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-copper ring-2 ring-background" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="copper" className="text-[10px]">{unread} new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2.5">
                <div className="flex w-full items-center gap-2">
                  {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-copper" />}
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{n.time}</span>
                </div>
                <span className="pl-0 text-xs text-muted-foreground">{n.desc}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 outline-none">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary/12 text-primary">{currentUser.initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              <Badge variant="default" className="mt-1.5 text-[10px]">{currentUser.role}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Building2 className="h-4 w-4" /> Workspace</DropdownMenuItem>
            <DropdownMenuItem><Settings className="h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
