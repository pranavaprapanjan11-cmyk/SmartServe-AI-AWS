"use client"

import { useState, useEffect, useCallback } from "react"
import { Building2, Settings, User, Bell, MapPin, Check, ClipboardList, CreditCard, CalendarClock, Boxes, Copy, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext"
import * as workspaceService from "@/lib/services/workspaceService"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface WorkspaceData {
  id: string;
  workspace_code: string;
  workspace_name: string;
  owner_id: string;
  created_at: string;
  owner_name: string;
  total_employees: number;
  total_active_users: number;
}

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function WorkspacePage() {
  const { token, user } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const [wsData, mData] = await Promise.all([
        workspaceService.getCurrentWorkspace(token),
        workspaceService.getWorkspaceMembers(token)
      ])
      setWorkspace(wsData)
      setMembers(mData)
    } catch (err: any) {
      console.error("Error loading workspace:", err)
      setError(err?.response?.data?.error || "Failed to fetch workspace details.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Workspace code copied to clipboard.")
  }

  const handleRegenerateCode = async () => {
    if (!token) return
    try {
      setSubmitting(true)
      const res = await workspaceService.regenerateWorkspaceCode(token)
      if (workspace) {
        setWorkspace({ ...workspace, workspace_code: res.workspace_code })
      }
      toast.success(`Workspace code regenerated: ${res.workspace_code}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to regenerate code.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U"

  return (
    <div className="space-y-6">
      <PageHeader title="Workspace" description="Manage your organization, members, profile, and alerts" />

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <Tabs defaultValue="workspace">
        <TabsList className="flex-wrap">
          <TabsTrigger value="workspace">
            <Building2 className="h-4 w-4" /> Workspace
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Workspace Management */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Info</CardTitle>
              <CardDescription>Details of your active organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {workspace && (
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between rounded-xl border p-6 bg-primary/5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{workspace.workspace_name}</h3>
                      <p className="text-sm text-muted-foreground">Owner: {workspace.owner_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Workspace Code</p>
                      <p className="text-xl font-mono font-bold text-amber-500">{workspace.workspace_code}</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleCopyCode(workspace.workspace_code)} title="Copy code">
                      <Copy className="h-4 w-4" />
                    </Button>
                    {user?.role === "OWNER" && (
                      <Button variant="outline" size="icon" disabled={submitting} onClick={handleRegenerateCode} title="Regenerate code">
                        <RefreshCw className={cn("h-4 w-4", submitting && "animate-spin")} />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-2xl font-bold">{workspace?.total_employees || members.length}</p>
                  <p className="text-xs text-muted-foreground">Workspace Members</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-2xl font-bold">{workspace?.total_active_users || 1}</p>
                  <p className="text-xs text-muted-foreground">Active Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>All employees registered under this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((m, i) => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-slate-800 text-xs font-bold text-slate-200">
                            {m.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.role === "OWNER" ? "copper" : m.role === "MANAGER" ? "info" : "outline"}>
                          {m.role}
                        </Badge>
                        <Badge variant={m.status === "ACTIVE" ? "success" : "secondary"} className="text-[10px]">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                    {i < members.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-serif text-xl font-semibold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="copper" className="mt-2">
                  {user?.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fname">Full Name</Label>
                <Input id="fname" readOnly value={user?.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" readOnly value={user?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" readOnly value={user?.role || ""} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "New orders", on: true },
                { label: "Low stock alerts", on: true },
                { label: "Reservation updates", on: true },
                { label: "Daily summary email", on: false },
              ].map((s, i, arr) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between py-3">
                    <p className="text-sm font-medium">{s.label}</p>
                    <Switch defaultChecked={s.on} />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
