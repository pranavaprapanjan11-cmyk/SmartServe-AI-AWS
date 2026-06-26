// All data here is mock/static. Backend integration will replace these later.

export const restaurants = [
  { id: "r1", name: "Saffron & Sage", location: "Bandra West, Mumbai", initials: "SS" },
  { id: "r2", name: "The Copper Spoon", location: "Indiranagar, Bangalore", initials: "CS" },
  { id: "r3", name: "Coastal Table", location: "Fort Kochi, Kerala", initials: "CT" },
]

export const workspaces = [
  { id: "w1", name: "Sage Hospitality Group", plan: "Enterprise" },
  { id: "w2", name: "Copper Collective", plan: "Growth" },
]

export const currentUser = {
  name: "Aarav Mehta",
  email: "aarav@sagehospitality.com",
  role: "Owner",
  initials: "AM",
}

export const revenueTrend = [
  { day: "Mon", revenue: 184000, orders: 312 },
  { day: "Tue", revenue: 162000, orders: 287 },
  { day: "Wed", revenue: 198000, orders: 341 },
  { day: "Thu", revenue: 221000, orders: 376 },
  { day: "Fri", revenue: 312000, orders: 498 },
  { day: "Sat", revenue: 386000, orders: 612 },
  { day: "Sun", revenue: 348000, orders: 561 },
]

export const hourlyOrders = [
  { hour: "11a", orders: 12 },
  { hour: "12p", orders: 34 },
  { hour: "1p", orders: 58 },
  { hour: "2p", orders: 41 },
  { hour: "3p", orders: 18 },
  { hour: "4p", orders: 9 },
  { hour: "5p", orders: 14 },
  { hour: "6p", orders: 29 },
  { hour: "7p", orders: 62 },
  { hour: "8p", orders: 78 },
  { hour: "9p", orders: 54 },
  { hour: "10p", orders: 22 },
]

export const categoryMix = [
  { name: "Main Course", value: 42 },
  { name: "Starters", value: 24 },
  { name: "Beverages", value: 18 },
  { name: "Desserts", value: 16 },
]

export const dashboardStats = {
  revenue: 386420,
  revenueDelta: 12.4,
  orders: 612,
  ordersDelta: 8.1,
  kitchenQueue: 5,
  reservations: 28,
  tablesOccupied: 18,
  tablesTotal: 24,
  inventoryAlerts: 4,
  employeesActive: 14,
  employeesTotal: 22,
  healthScore: 94,
}

export const recentActivity = [
  { id: "a1", type: "order", text: "Order #2841 placed for Table 12", time: "2 min ago" },
  { id: "a2", type: "payment", text: "Bill #2837 paid via UPI — ₹3,240", time: "6 min ago" },
  { id: "a3", type: "reservation", text: "New reservation for 6 at 8:30 PM", time: "11 min ago" },
  { id: "a4", type: "inventory", text: "Low stock alert: Paneer (2.4 kg left)", time: "18 min ago" },
  { id: "a5", type: "kitchen", text: "Order #2835 marked ready", time: "24 min ago" },
]

export type OrderStatus = "new" | "preparing" | "ready" | "served" | "completed"

export interface OrderItem {
  name: string
  qty: number
  notes?: string
}

export interface Order {
  id: string
  table: string
  server: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  placedAt: string
  elapsedMin: number
  priority: "normal" | "high"
}

export const orders: Order[] = [
  {
    id: "2841", table: "T12", server: "Riya", priority: "high", status: "new", placedAt: "8:42 PM", elapsedMin: 2,
    total: 1840,
    items: [{ name: "Butter Chicken", qty: 2 }, { name: "Garlic Naan", qty: 4 }, { name: "Jeera Rice", qty: 2, notes: "Less spicy" }],
  },
  {
    id: "2840", table: "T08", server: "Karan", priority: "normal", status: "preparing", placedAt: "8:36 PM", elapsedMin: 8,
    total: 2260,
    items: [{ name: "Paneer Tikka", qty: 1 }, { name: "Dal Makhani", qty: 1 }, { name: "Tandoori Roti", qty: 6 }],
  },
  {
    id: "2839", table: "T03", server: "Riya", priority: "normal", status: "preparing", placedAt: "8:30 PM", elapsedMin: 14,
    total: 980,
    items: [{ name: "Veg Biryani", qty: 1 }, { name: "Raita", qty: 1 }],
  },
  {
    id: "2838", table: "T15", server: "Meera", priority: "high", status: "ready", placedAt: "8:22 PM", elapsedMin: 19,
    total: 3120,
    items: [{ name: "Mutton Rogan Josh", qty: 2 }, { name: "Laccha Paratha", qty: 4 }, { name: "Gulab Jamun", qty: 2 }],
  },
  {
    id: "2837", table: "T06", server: "Karan", priority: "normal", status: "served", placedAt: "8:05 PM", elapsedMin: 38,
    total: 1540,
    items: [{ name: "Masala Dosa", qty: 2 }, { name: "Filter Coffee", qty: 2 }],
  },
  {
    id: "2836", table: "T19", server: "Meera", priority: "normal", status: "completed", placedAt: "7:48 PM", elapsedMin: 55,
    total: 2890,
    items: [{ name: "Fish Curry", qty: 1 }, { name: "Appam", qty: 4 }, { name: "Prawn Fry", qty: 1 }],
  },
]

export const menuItems = [
  { id: "m1", name: "Butter Chicken", category: "Main Course", price: 480, available: true },
  { id: "m2", name: "Paneer Tikka", category: "Starters", price: 360, available: true },
  { id: "m3", name: "Veg Biryani", category: "Main Course", price: 420, available: true },
  { id: "m4", name: "Garlic Naan", category: "Breads", price: 80, available: true },
  { id: "m5", name: "Gulab Jamun", category: "Desserts", price: 160, available: true },
  { id: "m6", name: "Masala Dosa", category: "Main Course", price: 220, available: true },
  { id: "m7", name: "Filter Coffee", category: "Beverages", price: 90, available: true },
  { id: "m8", name: "Dal Makhani", category: "Main Course", price: 340, available: false },
]

export interface RestaurantTable {
  id: string
  number: string
  seats: number
  status: "available" | "occupied" | "reserved" | "cleaning"
  server?: string
  guests?: number
  since?: string
}

export const tables: RestaurantTable[] = [
  { id: "t1", number: "T01", seats: 2, status: "available" },
  { id: "t2", number: "T02", seats: 2, status: "occupied", server: "Riya", guests: 2, since: "8:10 PM" },
  { id: "t3", number: "T03", seats: 4, status: "occupied", server: "Riya", guests: 3, since: "8:30 PM" },
  { id: "t4", number: "T04", seats: 4, status: "reserved", since: "9:00 PM" },
  { id: "t5", number: "T05", seats: 6, status: "cleaning" },
  { id: "t6", number: "T06", seats: 4, status: "occupied", server: "Karan", guests: 4, since: "8:05 PM" },
  { id: "t7", number: "T07", seats: 2, status: "available" },
  { id: "t8", number: "T08", seats: 6, status: "occupied", server: "Karan", guests: 5, since: "8:36 PM" },
  { id: "t9", number: "T09", seats: 8, status: "reserved", since: "8:45 PM" },
  { id: "t10", number: "T10", seats: 4, status: "available" },
  { id: "t11", number: "T11", seats: 2, status: "occupied", server: "Meera", guests: 2, since: "7:55 PM" },
  { id: "t12", number: "T12", seats: 4, status: "occupied", server: "Riya", guests: 4, since: "8:42 PM" },
]

export interface Reservation {
  id: string
  name: string
  guests: number
  time: string
  date: string
  phone: string
  table: string
  status: "confirmed" | "seated" | "waitlist" | "cancelled"
}

export const reservations: Reservation[] = [
  { id: "rs1", name: "Nandini Rao", guests: 6, time: "8:30 PM", date: "Today", phone: "+91 98200 12345", table: "T09", status: "confirmed" },
  { id: "rs2", name: "Vikram Shah", guests: 2, time: "9:00 PM", date: "Today", phone: "+91 99300 45678", table: "T04", status: "confirmed" },
  { id: "rs3", name: "Priya Kapoor", guests: 4, time: "8:45 PM", date: "Today", phone: "+91 98765 43210", table: "—", status: "waitlist" },
  { id: "rs4", name: "Arjun Nair", guests: 8, time: "9:30 PM", date: "Today", phone: "+91 90000 11111", table: "T20", status: "confirmed" },
  { id: "rs5", name: "Sara Khan", guests: 3, time: "7:30 PM", date: "Today", phone: "+91 91234 56789", table: "T11", status: "seated" },
  { id: "rs6", name: "Dev Patel", guests: 2, time: "10:00 PM", date: "Today", phone: "+91 98888 77777", table: "—", status: "cancelled" },
]

export interface InventoryItem {
  id: string
  name: string
  category: string
  stock: number
  unit: string
  par: number
  supplier: string
  expiry?: string
  status: "ok" | "low" | "critical"
}

export const inventoryItems: InventoryItem[] = [
  { id: "i1", name: "Paneer", category: "Dairy", stock: 2.4, unit: "kg", par: 10, supplier: "Amul Dairy", expiry: "2 days", status: "critical" },
  { id: "i2", name: "Basmati Rice", category: "Grains", stock: 48, unit: "kg", par: 30, supplier: "India Gate", status: "ok" },
  { id: "i3", name: "Chicken", category: "Meat", stock: 6.5, unit: "kg", par: 15, supplier: "Fresh Meats Co", expiry: "1 day", status: "low" },
  { id: "i4", name: "Tomatoes", category: "Vegetables", stock: 22, unit: "kg", par: 20, supplier: "Local Mandi", status: "ok" },
  { id: "i5", name: "Butter", category: "Dairy", stock: 3.2, unit: "kg", par: 8, supplier: "Amul Dairy", expiry: "5 days", status: "low" },
  { id: "i6", name: "Garam Masala", category: "Spices", stock: 1.1, unit: "kg", par: 3, supplier: "MDH Spices", status: "low" },
  { id: "i7", name: "Cooking Oil", category: "Pantry", stock: 35, unit: "L", par: 25, supplier: "Fortune", status: "ok" },
  { id: "i8", name: "Onions", category: "Vegetables", stock: 40, unit: "kg", par: 30, supplier: "Local Mandi", status: "ok" },
]

export const inventoryCategories = [
  { name: "Vegetables", items: 24, value: 38000 },
  { name: "Dairy", items: 12, value: 21000 },
  { name: "Meat", items: 9, value: 46000 },
  { name: "Spices", items: 31, value: 18000 },
  { name: "Grains", items: 14, value: 27000 },
]

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  visits: number
  totalSpent: number
  loyaltyTier: "Bronze" | "Silver" | "Gold" | "Platinum"
  lastVisit: string
  initials: string
}

export const customers: Customer[] = [
  { id: "c1", name: "Nandini Rao", email: "nandini@email.com", phone: "+91 98200 12345", visits: 42, totalSpent: 184200, loyaltyTier: "Platinum", lastVisit: "2 days ago", initials: "NR" },
  { id: "c2", name: "Vikram Shah", email: "vikram@email.com", phone: "+91 99300 45678", visits: 28, totalSpent: 96400, loyaltyTier: "Gold", lastVisit: "1 week ago", initials: "VS" },
  { id: "c3", name: "Priya Kapoor", email: "priya@email.com", phone: "+91 98765 43210", visits: 15, totalSpent: 52300, loyaltyTier: "Silver", lastVisit: "3 days ago", initials: "PK" },
  { id: "c4", name: "Arjun Nair", email: "arjun@email.com", phone: "+91 90000 11111", visits: 8, totalSpent: 31200, loyaltyTier: "Bronze", lastVisit: "2 weeks ago", initials: "AN" },
  { id: "c5", name: "Sara Khan", email: "sara@email.com", phone: "+91 91234 56789", visits: 33, totalSpent: 118900, loyaltyTier: "Gold", lastVisit: "Yesterday", initials: "SK" },
]

export interface Employee {
  id: string
  name: string
  role: string
  department: string
  status: "active" | "on-leave" | "off-shift"
  shift: string
  attendance: number
  performance: number
  salary: number
  initials: string
}

export const employees: Employee[] = [
  { id: "e1", name: "Riya Sharma", role: "Senior Server", department: "Front of House", status: "active", shift: "4 PM - 12 AM", attendance: 96, performance: 92, salary: 32000, initials: "RS" },
  { id: "e2", name: "Karan Singh", role: "Server", department: "Front of House", status: "active", shift: "4 PM - 12 AM", attendance: 91, performance: 88, salary: 28000, initials: "KS" },
  { id: "e3", name: "Chef Anand", role: "Head Chef", department: "Kitchen", status: "active", shift: "11 AM - 11 PM", attendance: 98, performance: 95, salary: 65000, initials: "CA" },
  { id: "e4", name: "Meera Iyer", role: "Server", department: "Front of House", status: "on-leave", shift: "—", attendance: 89, performance: 85, salary: 27000, initials: "MI" },
  { id: "e5", name: "Suresh Kumar", role: "Line Cook", department: "Kitchen", status: "active", shift: "11 AM - 11 PM", attendance: 94, performance: 90, salary: 30000, initials: "SK" },
  { id: "e6", name: "Pooja Desai", role: "Cashier", department: "Billing", status: "off-shift", shift: "12 PM - 8 PM", attendance: 92, performance: 87, salary: 26000, initials: "PD" },
]

export const topSellingItems = [
  { name: "Butter Chicken", sold: 184, revenue: 88320 },
  { name: "Veg Biryani", sold: 156, revenue: 65520 },
  { name: "Paneer Tikka", sold: 142, revenue: 51120 },
  { name: "Masala Dosa", sold: 128, revenue: 28160 },
  { name: "Garlic Naan", sold: 312, revenue: 24960 },
]

export const peakHours = [
  { hour: "12 PM", value: 34 },
  { hour: "1 PM", value: 58 },
  { hour: "2 PM", value: 41 },
  { hour: "7 PM", value: 62 },
  { hour: "8 PM", value: 78 },
  { hour: "9 PM", value: 54 },
]

export const monthlyRevenue = [
  { month: "Jul", revenue: 4820000 },
  { month: "Aug", revenue: 5120000 },
  { month: "Sep", revenue: 4980000 },
  { month: "Oct", revenue: 5640000 },
  { month: "Nov", revenue: 6210000 },
  { month: "Dec", revenue: 7180000 },
]

export const aiInsights = [
  { id: "ai1", title: "Friday dinner rush incoming", body: "Based on last 6 weeks, expect 18% higher footfall this Friday 8–10 PM. Schedule 2 extra servers.", tone: "info" as const },
  { id: "ai2", title: "Paneer running critically low", body: "Current stock lasts ~6 hours at today's pace. Auto-draft a purchase order to Amul Dairy?", tone: "warning" as const },
  { id: "ai3", title: "Upsell opportunity", body: "Gulab Jamun attaches to 64% of Mutton Rogan Josh orders. Prompt servers to suggest it.", tone: "success" as const },
]

export const salesForecast = [
  { day: "Mon", actual: 184000, forecast: 190000 },
  { day: "Tue", actual: 162000, forecast: 168000 },
  { day: "Wed", actual: 198000, forecast: 201000 },
  { day: "Thu", actual: 221000, forecast: 224000 },
  { day: "Fri", actual: null, forecast: 368000 },
  { day: "Sat", actual: null, forecast: 412000 },
  { day: "Sun", actual: null, forecast: 358000 },
]

export const notifications = [
  { id: "n1", title: "New order at Table 12", desc: "₹1,840 • 3 items", time: "2m", unread: true, type: "order" },
  { id: "n2", title: "Low stock: Paneer", desc: "2.4 kg remaining", time: "18m", unread: true, type: "inventory" },
  { id: "n3", title: "Payment received", desc: "Bill #2837 • ₹3,240 via UPI", time: "32m", unread: false, type: "payment" },
  { id: "n4", title: "Reservation confirmed", desc: "Nandini Rao • 6 guests • 8:30 PM", time: "1h", unread: false, type: "reservation" },
]
