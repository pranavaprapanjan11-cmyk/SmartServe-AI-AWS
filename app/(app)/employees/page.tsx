"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserCog, UserCheck, CalendarClock, Award, Search, Plus, Calendar, ShieldCheck, Landmark, ShieldAlert, Phone, Mail, CheckCircle2, XCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as employeeService from "@/lib/services/employeeService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function EmployeesPage() {
  const { token, user } = useAuth()
  const restaurantId = user?.restaurantId || user?.workspace_id || user?.id || ""

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<"directory" | "leaves" | "shifts" | "salary">("directory")
  
  // Data States
  const [employees, setEmployees] = useState<employeeService.Employee[]>([])
  const [leaves, setLeaves] = useState<employeeService.LeaveRequest[]>([])
  const [shifts, setShifts] = useState<employeeService.Shift[]>([])
  const [salaries, setSalaries] = useState<employeeService.SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  // Form Modals
  const [showAddEmp, setShowAddEmp] = useState(false)
  const [showAddShift, setShowAddShift] = useState(false)
  const [showAddSalary, setShowAddSalary] = useState(false)
  
  // Form Inputs
  const [submitting, setSubmitting] = useState(false)
  
  // 1. Employee Form
  const [empName, setEmpName] = useState("")
  const [empEmail, setEmpEmail] = useState("")
  const [empPhone, setEmpPhone] = useState("")
  const [empRole, setEmpRole] = useState<"WAITER" | "KITCHEN_STAFF" | "CASHIER" | "MANAGER">("WAITER")
  const [empPosition, setEmpPosition] = useState("")
  const [empSalary, setEmpSalary] = useState(0)

  // 2. Shift Form
  const [shiftName, setShiftName] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [breakMin, setBreakMin] = useState(30)

  // 3. Salary Form
  const [salaryEmpId, setSalaryEmpId] = useState("")
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7))
  const [salaryBase, setSalaryBase] = useState(25000)
  const [salaryBonus, setSalaryBonus] = useState(0)
  const [salaryDeduction, setSalaryDeduction] = useState(0)

  const loadEmployeeData = useCallback(async (showLoading = true) => {
    if (!token || !restaurantId) return
    if (showLoading) setLoading(true)
    try {
      if (activeTab === "directory") {
        const data = await employeeService.getEmployees(restaurantId, token)
        setEmployees(data)
      } else if (activeTab === "leaves") {
        const data = await employeeService.getLeaveRequests(restaurantId, token)
        setLeaves(data)
      } else if (activeTab === "shifts") {
        const data = await employeeService.getShifts(restaurantId, token)
        setShifts(data)
      } else if (activeTab === "salary") {
        const data = await employeeService.getSalaryRecords(restaurantId, token)
        setSalaries(data)
        const emps = await employeeService.getEmployees(restaurantId, token)
        setEmployees(emps)
      }
    } catch (err: any) {
      console.error("Failed to load staff details:", err)
      toast.error("Failed to fetch employee database.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token, restaurantId, activeTab])

  useEffect(() => {
    loadEmployeeData(true)
  }, [loadEmployeeData])

  // Handlers
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !restaurantId || !empName) return
    try {
      setSubmitting(true)
      await employeeService.createEmployee(
        restaurantId,
        {
          name: empName,
          email: empEmail || undefined,
          phone: empPhone || undefined,
          role: empRole,
          position: empPosition || empRole,
          salary: empSalary,
          salary_frequency: "MONTHLY",
          hire_date: new Date().toISOString().split("T")[0],
          status: "ACTIVE"
        },
        token
      )
      toast.success("Team member onboarded!")
      setEmpName("")
      setEmpEmail("")
      setEmpPhone("")
      setEmpSalary(0)
      setShowAddEmp(false)
      loadEmployeeData(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to add employee.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !restaurantId || !shiftName) return
    try {
      setSubmitting(true)
      await employeeService.createShift(
        restaurantId,
        {
          name: shiftName,
          start_time: startTime,
          end_time: endTime,
          break_duration_minutes: breakMin
        },
        token
      )
      toast.success("New shift created successfully!")
      setShiftName("")
      setShowAddShift(false)
      loadEmployeeData(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to create shift slot.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !restaurantId || !salaryEmpId) return
    try {
      setSubmitting(true)
      await employeeService.createSalaryRecord(
        restaurantId,
        {
          employeeId: salaryEmpId,
          employee_id: salaryEmpId,
          month: salaryMonth,
          base_salary: salaryBase,
          bonus: salaryBonus,
          deductions: salaryDeduction,
          status: "DRAFT"
        },
        token
      )
      toast.success("Payroll record added!")
      setShowAddSalary(false)
      loadEmployeeData(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to log salary details.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveLeave = async (leaveId: string, action: "APPROVED" | "REJECTED") => {
    if (!token || !restaurantId) return
    try {
      setLoading(true)
      await employeeService.approveLeave(restaurantId, leaveId, { notes: action }, token)
      toast.success(`Leave request set to ${action.toLowerCase()}!`)
      loadEmployeeData(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to process leave request.")
    } finally {
      setLoading(false)
    }
  }

  const handleFinalizeSalary = async (salaryId: string) => {
    if (!token || !restaurantId) return
    try {
      setLoading(true)
      await employeeService.finalizeSalary(restaurantId, salaryId, token)
      toast.success("Payroll record finalized / paid!")
      loadEmployeeData(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to process payroll record.")
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.role.toLowerCase().includes(query.toLowerCase())
    )
  }, [employees, query])

  // Stats
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length
  const monthlyPayroll = salaries.filter(s => s.status === "PAID").reduce((sum, s) => sum + Number(s.net_salary), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Staff & Roster" description="Manage restaurant employees, rosters, shift schedules and payroll">
        <div className="flex gap-2">
          {activeTab === "directory" && (
            <Dialog open={showAddEmp} onOpenChange={setShowAddEmp}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1.5" /> Add Employee</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Onboard New Staff</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <Input required value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="e.g. Ramesh Dev" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</label>
                      <select
                        value={empRole}
                        onChange={(e) => setEmpRole(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-card text-foreground focus:ring-primary text-sm"
                      >
                        <option value="WAITER">Waiter</option>
                        <option value="KITCHEN_STAFF">Chef / Cook</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</label>
                      <Input value={empPosition} onChange={(e) => setEmpPosition(e.target.value)} placeholder="e.g. Pastry Chef" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Phone</label>
                    <Input value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="+91 99999 77777" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <Input type="email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} placeholder="name@restaurant.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Base Salary (₹)</label>
                    <Input type="number" value={empSalary} onChange={(e) => setEmpSalary(parseInt(e.target.value) || 0)} />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddEmp(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>Onboard</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {activeTab === "shifts" && (
            <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1.5" /> Create Shift</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Define Work Shift</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddShift} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shift Name</label>
                    <Input required value={shiftName} onChange={(e) => setShiftName(e.target.value)} placeholder="e.g. Dinner Service" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time</label>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</label>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddShift(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {activeTab === "salary" && (
            <Dialog open={showAddSalary} onOpenChange={setShowAddSalary}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1.5" /> Log Salary</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Employee Payroll</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSalary} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Staff</label>
                    <select
                      value={salaryEmpId}
                      onChange={(e) => {
                        setSalaryEmpId(e.target.value)
                        const emp = employees.find(emp => emp.id === e.target.value)
                        if (emp && emp.salary) setSalaryBase(emp.salary)
                      }}
                      required
                      className="w-full h-10 px-3 rounded-md border border-input bg-card text-foreground focus:ring-primary text-sm"
                    >
                      <option value="">Choose employee...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</label>
                      <Input type="month" value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base Pay (₹)</label>
                      <Input type="number" value={salaryBase} onChange={(e) => setSalaryBase(parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bonus (₹)</label>
                      <Input type="number" value={salaryBonus} onChange={(e) => setSalaryBonus(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deductions (₹)</label>
                      <Input type="number" value={salaryDeduction} onChange={(e) => setSalaryDeduction(parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddSalary(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>Log Pay</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Staff" value={employees.length} icon={UserCog} accent="primary" index={0} />
        <StatCard label="On Shift Active" value={activeCount} icon={UserCheck} accent="emerald" index={1} />
        <StatCard label="Pending Leaves" value={pendingLeaves} icon={CalendarClock} accent="sky" index={2} />
        <StatCard label="Setted Payroll" value={`₹${(monthlyPayroll / 1000).toFixed(0)}k`} icon={Landmark} accent="copper" index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as any)
            setQuery("")
          }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
              <TabsList>
                <TabsTrigger value="directory">Directory</TabsTrigger>
                <TabsTrigger value="leaves">Leaves ({pendingLeaves} Req)</TabsTrigger>
                <TabsTrigger value="shifts">Shifts</TabsTrigger>
                <TabsTrigger value="salary">Payroll</TabsTrigger>
              </TabsList>

              {activeTab === "directory" && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search roster..."
                    className="pl-9"
                  />
                </div>
              )}
            </div>

            {/* TAB CONTENT: DIRECTORY */}
            {activeTab === "directory" && (
              <TabsContent value="directory" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((e) => {
                    const initials = e.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-copper/10 text-xs font-semibold text-copper">
                                {initials || "E"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{e.name}</p>
                              <p className="text-xs text-muted-foreground">{e.position || e.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs text-muted-foreground">
                            {e.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</p>}
                            {e.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {e.hire_date ? new Date(e.hire_date).toLocaleDateString() : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.status === "ACTIVE" ? "success" : e.status === "ON_LEAVE" ? "warning" : "secondary"}>
                            {e.status === "ACTIVE" ? "On Shift" : e.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </TabsContent>
            )}

            {/* TAB CONTENT: LEAVES */}
            {activeTab === "leaves" && (
              <TabsContent value="leaves" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name || `Staff ID: ${l.employee_id.substring(0,6)}`}</TableCell>
                      <TableCell><Badge variant="outline">{l.leave_type}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()} ({l.duration_days} days)
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{l.reason || "None"}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === "APPROVED" ? "success" : l.status === "PENDING" ? "warning" : "danger"}>
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1.5">
                        {l.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleApproveLeave(l.id, "APPROVED")}>
                              Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleApproveLeave(l.id, "REJECTED")}>
                              Reject
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaves.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                        No leave requests logged.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TabsContent>
            )}

            {/* TAB CONTENT: SHIFTS */}
            {activeTab === "shifts" && (
              <TabsContent value="shifts" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift Slot</TableHead>
                    <TableHead>Timing</TableHead>
                    <TableHead>Break Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold">{s.name}</TableCell>
                      <TableCell className="font-medium text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.start_time} - {s.end_time}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{s.break_duration_minutes || 0} mins</TableCell>
                    </TableRow>
                  ))}
                  {shifts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground text-sm">
                        No shift templates defined.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TabsContent>
            )}

            {/* TAB CONTENT: SALARY */}
            {activeTab === "salary" && (
              <TabsContent value="salary" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Payroll Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((s) => {
                    const emp = employees.find(e => e.id === s.employee_id)
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{emp?.name || `Employee ${s.employee_id.substring(0,4)}`}</p>
                            <p className="text-xs text-muted-foreground">{emp?.role}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{s.month}</TableCell>
                        <TableCell className="text-xs">₹{s.base_salary}</TableCell>
                        <TableCell className="text-xs text-emerald-500">+₹{s.bonus || 0}</TableCell>
                        <TableCell className="text-xs text-destructive">-₹{s.deductions || 0}</TableCell>
                        <TableCell className="font-semibold">₹{s.net_salary}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "PAID" ? "success" : s.status === "FINALIZED" ? "info" : "secondary"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          {s.status === "DRAFT" && (
                            <Button size="sm" variant="secondary" onClick={() => handleFinalizeSalary(s.id)}>
                              Finalize / Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {salaries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                        No payroll items logged for current staff.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
