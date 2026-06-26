"use client"

import { useState } from "react"
import { Building2, Settings, User, Bell, MapPin, Check, ClipboardList, CreditCard, CalendarClock, Boxes } from "lucide-react"
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
import { workspaces, restaurants, currentUser, notifications } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const notifIcon = {
  order: ClipboardList,
  inventory: Boxes,
  payment: CreditCard,
  reservation: CalendarClock,
} as const

const notifTone = {
  order: "bg-primary/10 text-primary",
  inventory: "bg-amber-500/10 text-amber-500",
  payment: "bg-emerald-500/10 text-emerald-500",
  reservation: "bg-sky-500/10 text-sky-500",
} as const

export default function WorkspacePage() {
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0].id)

  return (
    <div className="space-y-6">
      <PageHeader title="Workspace" description="Manage your organization, restaurants, profile, and alerts" />

      <Tabs defaultValue="workspace">
        <TabsList className="flex-wrap">
          <TabsTrigger value="workspace">
            <Building2 className="h-4 w-4" /> Workspace
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" /> Restaurant
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
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Switch between your workspaces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveWorkspace(w.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                    activeWorkspace === w.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.plan} plan</p>
                  </div>
                  {activeWorkspace === w.id && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Restaurants</CardTitle>
              <CardDescription>Locations in this workspace</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-copper/12 text-sm font-semibold text-copper">
                        {r.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {r.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restaurant Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
              <CardDescription>Saffron &amp; Sage · Bandra West, Mumbai</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rname">Restaurant Name</Label>
                <Input id="rname" defaultValue="Saffron & Sage" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+91 22 4000 1234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input id="cuisine" defaultValue="North Indian, Mughlai" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Seating Capacity</Label>
                <Input id="seats" type="number" defaultValue={96} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addr">Address</Label>
                <Input id="addr" defaultValue="12 Hill Road, Bandra West, Mumbai 400050" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
              <CardDescription>Service preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "Accept online reservations", desc: "Allow guests to book tables online", on: true },
                { label: "Auto-assign kitchen tickets", desc: "Route orders to stations automatically", on: true },
                { label: "Enable AI reorder alerts", desc: "Get notified before stock runs out", on: true },
                { label: "Surge pricing", desc: "Adjust prices during peak hours", on: false },
              ].map((s, i, arr) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    <Switch defaultChecked={s.on} />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        {/* User Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-serif text-xl font-semibold">{currentUser.name}</h2>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <Badge variant="copper" className="mt-2">
                  {currentUser.role}
                </Badge>
              </div>
              <Button variant="outline">Change Photo</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fname">Full Name</Label>
                <Input id="fname" defaultValue={currentUser.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={currentUser.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue={currentUser.role} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uphone">Phone</Label>
                <Input id="uphone" defaultValue="+91 98765 00000" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button>Update Profile</Button>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>{notifications.filter((n) => n.unread).length} unread</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Mark all read
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {notifications.map((n) => {
                const Icon = notifIcon[n.type as keyof typeof notifIcon]
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
                      n.unread && "bg-primary/[0.04]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        notifTone[n.type as keyof typeof notifTone],
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{n.time}</span>
                      {n.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

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
