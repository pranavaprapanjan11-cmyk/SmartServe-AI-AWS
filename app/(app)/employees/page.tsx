"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { UserCog, UserCheck, CalendarClock, Award, Search } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { employees, type Employee } from "@/lib/mock-data"

const statusVariant: Record<Employee["status"], "success" | "warning" | "secondary"> = {
  active: "success",
  "on-leave": "warning",
  "off-shift": "secondary",
}

const statusLabel: Record<Employee["status"], string> = {
  active: "On Shift",
  "on-leave": "On Leave",
  "off-shift": "Off Shift",
}

export default function EmployeesPage() {
  const [query, setQuery] = useState("")
  const filtered = employees.filter(
    (e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.role.toLowerCase().includes(query.toLowerCase()),
  )

  const active = employees.filter((e) => e.status === "active").length
  const avgAttendance = Math.round(employees.reduce((s, e) => s + e.attendance, 0) / employees.length)
  const avgPerformance = Math.round(employees.reduce((s, e) => s + e.performance, 0) / employees.length)

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description="Staff roster, shifts, and performance">
        <Button variant="outline">Manage Shifts</Button>
        <Button>Add Employee</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Staff" value={employees.length} icon={UserCog} accent="primary" index={0} />
        <StatCard label="On Shift Now" value={active} icon={UserCheck} accent="emerald" index={1} />
        <StatCard label="Avg Attendance" value={`${avgAttendance}%`} icon={CalendarClock} accent="sky" index={2} />
        <StatCard label="Avg Performance" value={`${avgPerformance}%`} icon={Award} accent="copper" index={3} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Team Roster</CardTitle>
            <CardDescription>{filtered.length} members</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="w-36">Performance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-copper/12 text-xs font-semibold text-copper">
                          {e.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{e.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.department}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{e.shift}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={e.performance} className="h-1.5 w-20" />
                      <span className="text-xs font-medium">{e.performance}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[e.status]}>{statusLabel[e.status]}</Badge>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
