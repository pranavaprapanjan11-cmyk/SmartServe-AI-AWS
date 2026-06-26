import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SmartServe AI — Enterprise Restaurant OS",
  description:
    "The AI-powered operating system for premium restaurant chains. Orders, kitchen, billing, inventory, CRM, and analytics in one elegant workspace.",
}

export const viewport: Viewport = {
  themeColor: "#14352f",
  width: "device-width",
  initialScale: 1,
}

import { AuthProvider } from "@/context/AuthContext"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <body className={`${jakarta.variable} ${fraunces.variable} ${jetbrains.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
