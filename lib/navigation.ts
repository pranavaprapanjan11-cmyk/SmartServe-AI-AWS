import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  Receipt,
  Grid3x3,
  CalendarClock,
  Boxes,
  Users,
  UserCog,
  BarChart3,
  Sparkles,
  Building2,
  FileText,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { title: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      { title: "Orders", href: "/orders", icon: ClipboardList, badge: "12" },
      { title: "Kitchen Display", href: "/kitchen", icon: ChefHat, badge: "5" },
      { title: "Billing / POS", href: "/billing", icon: Receipt },
      { title: "Tables", href: "/tables", icon: Grid3x3 },
      { title: "Reservations", href: "/reservations", icon: CalendarClock },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Inventory", href: "/inventory", icon: Boxes },
      { title: "CRM", href: "/crm", icon: Users },
      { title: "Employees", href: "/employees", icon: UserCog },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "AI Suite",
    items: [
      { title: "AI Studio", href: "/ai", icon: Sparkles },
      { title: "OCR Scanner", href: "/ocr", icon: FileText }
    ],
  },
  {
    label: "Workspace",
    items: [{ title: "Workspace", href: "/workspace", icon: Building2 }],
  },
]

export function findNavTitle(pathname: string): string {
  for (const section of navSections) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.title
      }
    }
  }
  return "SmartServe"
}
