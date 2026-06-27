"use client"

import { useEffect, useState } from "react"
import { Building2, Save, RefreshCw, HelpCircle, Landmark } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import * as settingsService from "@/lib/services/settingsService"
import { toast } from "sonner"

export default function SettingsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    restaurant_name: "",
    branch_name: "",
    address: "",
    contact_number: "",
    gst_number: "",
    email: "",
    website: "",
    logo_url: "",
    upi_id: "",
    tax_percent: 18.0,
    currency: "INR"
  })

  useEffect(() => {
    async function loadSettings() {
      if (!token) return
      try {
        setLoading(true)
        const data = await settingsService.fetchRestaurantSettings(token)
        if (data) {
          setSettings({
            restaurant_name: data.restaurant_name || "",
            branch_name: data.branch_name || "",
            address: data.address || "",
            contact_number: data.contact_number || "",
            gst_number: data.gst_number || "",
            email: data.email || "",
            website: data.website || "",
            logo_url: data.logo_url || "",
            upi_id: data.upi_id || "",
            tax_percent: data.tax_percent !== undefined ? Number(data.tax_percent) : 18.0,
            currency: data.currency || "INR"
          })
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
        toast.error("Failed to load restaurant profile settings.")
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [token])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!settings.restaurant_name) {
      toast.error("Restaurant Name is required.")
      return
    }

    try {
      setSaving(true)
      await settingsService.saveRestaurantSettings(token, settings as any)
      toast.success("Restaurant profile settings saved successfully.")
      
      // Dispatch event to notify layout updates or calculations
      window.dispatchEvent(new CustomEvent("settingsUpdated"))
    } catch (err) {
      console.error("Failed to save settings:", err)
      toast.error("Failed to save restaurant settings.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage restaurant profile, taxation, and operations settings" />
        <div className="space-y-6 animate-pulse">
          <div className="h-96 rounded-2xl bg-muted/40 border border-border/40" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage restaurant profile, taxation, and operations settings" />

      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-xl font-serif flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" /> Restaurant Profile
            </CardTitle>
            <CardDescription>Configure receipt details, branches, taxation rules, and payment profiles</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Row 1: Restaurant Name & Branch Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restaurant Name <span className="text-destructive">*</span></label>
                <Input
                  type="text"
                  placeholder="e.g. Saffron & Sage"
                  value={settings.restaurant_name}
                  onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                  className="text-foreground bg-background border-border"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branch Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Indiranagar Branch"
                  value={settings.branch_name}
                  onChange={(e) => setSettings({ ...settings, branch_name: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
            </div>

            {/* Row 2: Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</label>
              <textarea
                placeholder="Full physical address for bills/receipts"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground border-border"
              />
            </div>

            {/* Row 3: GST Number, Phone Number & Email */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GST Number</label>
                <Input
                  type="text"
                  placeholder="e.g. 29AAAAA1111A1Z1"
                  value={settings.gst_number}
                  onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                <Input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={settings.contact_number}
                  onChange={(e) => setSettings({ ...settings, contact_number: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. contact@saffronandsage.com"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
            </div>

            {/* Row 4: Website & Logo URL */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website URL</label>
                <Input
                  type="url"
                  placeholder="e.g. https://saffronandsage.com"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logo Image URL</label>
                <Input
                  type="text"
                  placeholder="e.g. https://saffronandsage.com/assets/logo.png"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
            </div>

            {/* Row 5: UPI ID, Tax % & Currency */}
            <div className="grid gap-4 sm:grid-cols-3 border-t border-border/40 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  UPI ID <Landmark className="h-3 w-3 text-primary" />
                </label>
                <Input
                  type="text"
                  placeholder="e.g. saffronandsage@oksbi"
                  value={settings.upi_id}
                  onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax Percentage (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={settings.tax_percent}
                  onChange={(e) => setSettings({ ...settings, tax_percent: parseFloat(e.target.value) || 0 })}
                  className="text-foreground bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency Code</label>
                <Input
                  type="text"
                  placeholder="e.g. INR or USD"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="text-foreground bg-background border-border"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button type="submit" disabled={saving} className="font-semibold flex items-center gap-2">
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving settings...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
