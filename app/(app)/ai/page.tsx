"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  RefreshCw,
  Clock
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as aiService from "@/lib/services/aiService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const quickPrompts = [
  { icon: TrendingUp, label: "Forecast next week" },
  { icon: Boxes, label: "What should I reorder?" },
  { icon: Lightbulb, label: "Top upsell opportunities" },
  { icon: FileText, label: "Summarize today" },
]

interface Msg {
  role: "user" | "ai"
  text: string
}

export default function AIStudioPage() {
  const { token } = useAuth()
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"chat" | "analytics" | "reports">("chat")
  
  // Chat States
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi, I'm Chef — your AI restaurant co-pilot. Ask me about sales, inventory, staffing, or menu performance." },
  ])
  const [chatLoading, setChatLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Analytics / Recommendations States
  const [recommendations, setRecommendations] = useState<aiService.Recommendation[]>([])
  const [salesForecast, setSalesForecast] = useState<aiService.SalesForecast | null>(null)
  const [menuInsights, setMenuInsights] = useState<aiService.MenuInsights | null>(null)
  const [healthScore, setHealthScore] = useState<aiService.HealthScoreResponse | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Report States
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false)
  const [reportMarkdown, setReportMarkdown] = useState("")
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [messages])

  // Load analytics details
  const loadAnalyticsData = async (showLoading = true) => {
    if (!token) return
    if (showLoading) setAnalyticsLoading(true)
    try {
      const [recs, forecast, insights, health] = await Promise.all([
        aiService.fetchRecommendations(token),
        aiService.fetchSalesForecast(token),
        aiService.fetchMenuInsights(token),
        aiService.fetchHealthScore(token)
      ])
      setRecommendations(recs)
      setSalesForecast(forecast)
      setMenuInsights(insights)
      setHealthScore(health)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load AI analytics.")
    } finally {
      if (showLoading) setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalyticsData(true)
    }
  }, [activeTab])

  // Send message
  const handleSendMessage = async (text: string) => {
    const value = text.trim()
    if (!value || !token || chatLoading) return

    // Update locally
    setMessages((m) => [...m, { role: "user", text: value }])
    setChatInput("")
    setChatLoading(true)

    try {
      const historyPayload = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        content: m.text
      }))
      
      const responseText = await aiService.sendAiChatMessage(value, historyPayload, token)
      setMessages((m) => [...m, { role: "ai", text: responseText }])
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to get response from AI co-pilot.")
      setMessages((m) => [...m, { role: "ai", text: "⚠️ Sorry, I could not complete that request. Please try again." }])
    } finally {
      setChatLoading(false)
    }
  }

  // Load AI business report summary
  const handleLoadReportPreview = async () => {
    if (!token) return
    try {
      setReportLoading(true)
      setReportPreviewOpen(true)
      const data = await aiService.fetchAiReport(token)
      setReportMarkdown(data.summary || "")
    } catch (err) {
      console.error(err)
      toast.error("Failed to compile operations report.")
      setReportPreviewOpen(false)
    } finally {
      setReportLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!reportMarkdown) return
    const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `restaurant_report_${new Date().toISOString().split("T")[0]}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Report downloaded successfully!")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI Studio" description="Automated business analysis, predictions, and chat co-pilot">
        <Badge variant="success" className="gap-1.5 px-3 py-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live Gemini Integrated
        </Badge>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-1.5" /> Chat
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-1.5" /> AI Predictions
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-1.5" /> Reports Engine
          </TabsTrigger>
        </TabsList>

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <TabsContent value="chat">
          <Card className="flex h-[560px] flex-col">
            <CardHeader className="border-b border-border/50 py-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                Smart Restaurant Co-pilot
              </CardTitle>
            </CardHeader>
            <CardContent ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin py-4 px-4 bg-muted/5">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm border",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground border-primary"
                        : "rounded-bl-sm bg-card text-foreground border-border"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-card border border-border px-4 py-3 text-sm text-muted-foreground shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              )}
            </CardContent>
            <div className="border-t border-border/50 p-4 bg-card">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickPrompts.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => handleSendMessage(q.label)}
                    disabled={chatLoading}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground hover:bg-muted/40 disabled:opacity-50"
                  >
                    <q.icon className="h-3.5 w-3.5" /> {q.label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage(chatInput)
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5"
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  placeholder="Ask anything about sales, menus, waitstaff, or inventory..."
                  className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9"
                  disabled={chatLoading || !chatInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
          </TabsContent>
        )}

        {/* PREDICTIONS TAB */}
        {activeTab === "analytics" && (
          <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recommendations list */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Live AI Insights
                </h3>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent shadow-sm">
                        <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{rec.recommendation}</p>
                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {recommendations.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-3 italic">No operations insights generated currently.</p>
                  )}
                </div>
              </div>

              {/* Predictions Detail cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Tomorrow's Sales Forecast</CardTitle>
                    <CardDescription>Predicted target based on recent sales trends</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-serif font-bold text-primary">
                        ₹{salesForecast?.predictedTomorrowRevenue?.toLocaleString("en-IN") || "0"}
                      </span>
                      <span className="text-xs text-muted-foreground">expected tomorrow</span>
                    </div>
                    <div className="border-t border-border pt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Yesterday Actual Revenue:</span>
                        <span className="font-medium text-foreground">₹{salesForecast?.yesterdayRevenue?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Cumulative Target:</span>
                        <span className="font-medium text-foreground">₹{salesForecast?.predictedWeeklyRevenue?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sales Trend indicator:</span>
                        <Badge variant="outline" className="text-xs text-primary">{salesForecast?.revenueTrend || "Stable"}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Menu Popularity Breakdown</CardTitle>
                    <CardDescription>Customer popularity matrix highlights</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {menuInsights ? (
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <div>
                            <span className="text-xs font-semibold block text-foreground">⭐ Star Seller</span>
                            <span className="text-xs">{menuInsights.bestSeller?.name || "None"}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{menuInsights.bestSeller?.quantitySold || 0} sold</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <div>
                            <span className="text-xs font-semibold block text-foreground">📈 Highest Revenue Generator</span>
                            <span className="text-xs">{menuInsights.highestRevenueItem?.name || "None"}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">₹{menuInsights.highestRevenueItem?.revenue?.toLocaleString("en-IN") || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between pb-1">
                          <div>
                            <span className="text-xs font-semibold block text-foreground">🕒 Peak Orders Period</span>
                            <span className="text-xs flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {menuInsights.peakSalesPeriod || "No data"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No menu analytics insights fetched.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          </TabsContent>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="h-full">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      Daily Business operations Report <Badge variant="secondary">Daily</Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Automated operations, low stock alerts, revenue metrics, and staffing suggestions report.</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleLoadReportPreview} className="gap-1">
                      Preview Report <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Preview Dialog */}
          <Dialog open={reportPreviewOpen} onOpenChange={setReportPreviewOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col justify-between overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-serif text-lg">
                  <FileText className="h-5 w-5 text-primary" /> AI Compiled Business Report
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto scrollbar-thin border border-border rounded-xl p-4 bg-muted/5 text-sm leading-relaxed whitespace-pre-line my-4 min-h-[300px]">
                {reportLoading ? (
                  <div className="flex h-full min-h-[250px] items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs ml-2">Compiling live metrics...</span>
                  </div>
                ) : (
                  reportMarkdown || "No report generated."
                )}
              </div>

              <DialogFooter className="border-t border-border/40 pt-3">
                <Button variant="outline" onClick={() => setReportPreviewOpen(false)}>Close</Button>
                <Button onClick={handleDownloadReport} disabled={reportLoading || !reportMarkdown} className="gap-1">
                  <Download className="h-4 w-4" /> Download Markdown
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
