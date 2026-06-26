"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Users, Star, IndianRupee, Repeat, Search, Mail, Phone } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { customers, type Customer } from "@/lib/mock-data"

const tierVariant: Record<Customer["loyaltyTier"], "secondary" | "info" | "warning" | "copper"> = {
  Bronze: "secondary",
  Silver: "info",
  Gold: "warning",
  Platinum: "copper",
}

export default function CRMPage() {
  const [query, setQuery] = useState("")
  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()),
  )

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
  const avgVisits = Math.round(customers.reduce((s, c) => s + c.visits, 0) / customers.length)
  const loyal = customers.filter((c) => c.loyaltyTier === "Gold" || c.loyaltyTier === "Platinum").length

  return (
    <div className="space-y-6">
      <PageHeader title="CRM" description="Customer relationships, loyalty, and lifetime value">
        <Button>Add Customer</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Customers" value={customers.length} icon={Users} accent="primary" index={0} />
        <StatCard
          label="Lifetime Value"
          value={`₹${(totalSpent / 100000).toFixed(1)}L`}
          icon={IndianRupee}
          accent="copper"
          index={1}
        />
        <StatCard label="Avg Visits" value={avgVisits} icon={Repeat} accent="sky" index={2} />
        <StatCard label="VIP Members" value={loyal} icon={Star} accent="amber" index={3} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>{filtered.length} records</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers..."
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
                <TableHead>Tier</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {c.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tierVariant[c.loyaltyTier]}>{c.loyaltyTier}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{c.visits}</TableCell>
                  <TableCell className="font-semibold">₹{c.totalSpent.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-muted-foreground">{c.lastVisit}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
