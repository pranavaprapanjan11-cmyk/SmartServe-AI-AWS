import type React from "react"
import { AppShell } from "@/components/shell/app-shell"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}
