"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Users, Star, IndianRupee, Repeat, Search, Mail, Phone, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as crmService from "@/lib/services/crmService"
import { toast } from "sonner"

interface CustomerRecord {
  id: string
  name: string
  email: string
  phone: string
  loyalty_points: number
  visits_count?: number
  total_spent?: number | string
  loyalty_tier?: string
  last_visit_date?: string
}

const getTierVariant = (tier?: string): "secondary" | "info" | "warning" | "copper" => {
  const t = (tier || "Bronze").toLowerCase()
  if (t === "silver") return "info"
  if (t === "gold") return "warning"
  if (t === "platinum") return "copper"
  return "secondary"
}

export default function CRMPage() {
  const { token } = useAuth()
  
  // Data State
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  // Form State
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadCustomers = async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const data = await crmService.getCustomers(token)
      setCustomers(data)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load customer database.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !name || !phone) return
    try {
      setSubmitting(true)
      await crmService.createCustomer({ name, email, phone }, token)
      toast.success("Customer added successfully!")
      setName("")
      setEmail("")
      setPhone("")
      setIsOpen(false)
      loadCustomers(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to create customer record.")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter
  const filtered = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
    )
  }, [customers, query])

  // Calculations
  const totalSpent = useMemo(() => {
    return customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0)
  }, [customers])

  const avgVisits = useMemo(() => {
    if (customers.length === 0) return 0
    return Math.round(customers.reduce((sum, c) => sum + (c.visits_count || 0), 0) / customers.length)
  }, [customers])

  const vipMembers = useMemo(() => {
    return customers.filter(c => c.loyalty_points >= 500).length
  }, [customers])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="CRM" description="Customer profiles, loyalty records, and dining analytics">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Customer Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Kapoor" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Save Customer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Customers" value={customers.length} icon={Users} accent="primary" index={0} />
        <StatCard
          label="Lifetime Value"
          value={`₹${(totalSpent / 1000).toFixed(1)}k`}
          icon={IndianRupee}
          accent="copper"
          index={1}
        />
        <StatCard label="Avg Visits" value={avgVisits} icon={Repeat} accent="sky" index={2} />
        <StatCard label="VIP Members" value={vipMembers} icon={Star} accent="amber" index={3} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Customers Directory</CardTitle>
            <CardDescription>{filtered.length} records found</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => {
                const initials = c.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                return (
                  <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {initials || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {c.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>}
                        <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTierVariant(c.loyalty_tier)}>
                        {c.loyalty_points} pts
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{c.visits_count || 0}</TableCell>
                    <TableCell className="font-semibold">₹{Number(c.total_spent || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {c.last_visit_date ? new Date(c.last_visit_date).toLocaleDateString() : "Never"}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No customers found matching search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
