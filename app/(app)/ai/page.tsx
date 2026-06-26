"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  Send,
  MessageSquare,
  BarChart3,
  FileText,
  TrendingUp,
  Boxes,
  Lightbulb,
  Download,
  ArrowUpRight,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RevenueAreaChart, ForecastLineChart } from "@/components/charts/charts"
import { salesForecast, monthlyRevenue, aiInsights } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const quickPrompts = [
  { icon: TrendingUp, label: "Forecast next week" },
  { icon: Boxes, label: "What should I reorder?" },
  { icon: Lightbulb, label: "Top upsell opportunities" },
  { icon: FileText, label: "Summarize today" },
]

const cannedReplies: Record<string, string> = {
  default:
    "Tonight is tracking 12% above last Sunday — ₹3.86L across 612 orders with a healthy kitchen queue of 5 tickets. Would you like a category breakdown or a staffing recommendation?",
  "Forecast next week":
    "Next week projects ₹24.8L total (+9% WoW). Friday and Saturday dinner (8–10 PM) drive 38% of volume. I recommend 2 extra servers on weekends and prepping 20% more Butter Chicken base.",
  "What should I reorder?":
    "Two items need attention now: Paneer (2.4 kg, ~6 hrs left) and Chicken (6.5 kg, 1 day). I can draft purchase orders to Amul Dairy (10 kg) and Fresh Meats Co (15 kg).",
  "Top upsell opportunities":
    "Gulab Jamun attaches to 64% of Mutton Rogan Josh orders, and Filter Coffee pairs with 58% of dosa orders. Prompting servers on these could lift average ticket by ~₹85.",
  "Summarize today":
    "₹3.86L revenue (+12.4%), 612 orders, ₹631 avg ticket, 18/24 tables occupied, 94 health score. Top seller: Butter Chicken (184). Watch item: Paneer stock.",
}

interface Msg {
  role: "user" | "ai"
  text: string
}

const reports = [
  { title: "Daily Operations Summary", desc: "Revenue, orders, labor, and inventory snapshot", tag: "Daily" },
  { title: "Weekly Performance Review", desc: "WoW trends, peak analysis, and forecasts", tag: "Weekly" },
  { title: "Menu Engineering Report", desc: "Star, plow-horse, puzzle, and dog classification", tag: "Monthly" },
  { title: "Inventory & Wastage Audit", desc: "Stock turns, spoilage, and reorder efficiency", tag: "Monthly" },
]

function ChatTab() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi, I'm Chef — your AI co-pilot. Ask me about sales, inventory, staffing, or menu performance." },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  function send(text: string) {
    const value = text.trim()
    if (!value) return
    const reply = cannedReplies[value] || cannedReplies.default
    setMessages((m) => [...m, { role: "user", text: value }, { role: "ai", text: reply }])
    setInput("")
  }

  return (
    <Card className="flex h-[560px] flex-col">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          Chef AI Chat
        </CardTitle>
      </CardHeader>
      <CardContent ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-thin py-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted text-foreground",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </CardContent>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickPrompts.map((q) => (
            <button
              key={q.label}
              onClick={() => send(q.label)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <q.icon className="h-3.5 w-3.5" /> {q.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Chef anything about your restaurant..."
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary p-2 text-primary-foreground transition-transform hover:scale-105"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Card>
  )
}

const inrLakh = (v: number) => `₹${(v / 100000).toFixed(1)}L`
const inrK = (v: number) => `₹${(v / 1000).toFixed(0)}k`

export default function AIStudioPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Studio" description="Chat, predictive analytics, and automated reports">
        <Badge variant="success" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Smart mode active
        </Badge>
      </PageHeader>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4" /> AI Analytics
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <ChatTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {aiInsights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/[0.05] to-transparent">
                  <CardContent className="p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-sm font-semibold">{insight.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecast</CardTitle>
                <CardDescription>AI-predicted revenue vs actuals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  <ForecastLineChart data={salesForecast} formatter={inrK} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trajectory</CardTitle>
                <CardDescription>6-month modeled growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  <RevenueAreaChart data={monthlyRevenue} dataKey="revenue" xKey="month" formatter={inrLakh} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reports.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full">
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-copper/12 text-copper">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{r.title}</p>
                        <Badge variant="secondary">{r.tag}</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                        <Button size="sm" variant="ghost" className="text-primary hover:text-primary">
                          Preview <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent">
            <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">Generate a custom report</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Describe what you need and Chef will compile it from your live data.
                  </p>
                </div>
              </div>
              <Button>Create Report</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
