"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, Send, TrendingUp, Boxes, FileText, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

const quickPrompts = [
  { icon: TrendingUp, label: "Sales forecast" },
  { icon: Boxes, label: "Inventory tips" },
  { icon: FileText, label: "Daily report" },
  { icon: Lightbulb, label: "Insights" },
]

const cannedReplies: Record<string, string> = {
  default:
    "Today is tracking 12% above last Sunday with ₹3.86L in revenue across 612 orders. Your kitchen queue is healthy at 5 active tickets. Want me to break down performance by category?",
  "Sales forecast":
    "Next 3 days forecast: Fri ₹3.68L, Sat ₹4.12L, Sun ₹3.58L. Saturday peaks 8–10 PM — I'd recommend 2 extra servers and prepping 20% more Butter Chicken base.",
  "Inventory tips":
    "Paneer is critically low (2.4 kg, ~6 hrs left) and Chicken is low. I can auto-draft purchase orders to Amul Dairy and Fresh Meats Co. Shall I prepare them?",
  "Daily report":
    "Today's snapshot: ₹3.86L revenue (+12.4%), 612 orders, avg ticket ₹631, 18/24 tables occupied, 94 health score. Top item: Butter Chicken (184 sold).",
  Insights:
    "Gulab Jamun attaches to 64% of Mutton Rogan Josh orders — a strong upsell prompt for servers. Also, Table 8 has the longest dwell time tonight.",
}

interface Msg {
  role: "user" | "ai"
  text: string
}

function ChefRobot({ small }: { small?: boolean }) {
  return (
    <motion.div
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      className={cn("relative", small ? "h-7 w-7" : "h-9 w-9")}
    >
      {/* Waving hand */}
      <motion.span
        className="absolute -left-1 top-2.5 z-20 block h-1.5 w-1.5 rounded-full bg-background/95"
        style={{ transformOrigin: "bottom right" }}
        animate={{ rotate: [0, 28, -8, 24, 0] }}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" }}
      />
      {/* Chef hat */}
      <div className="absolute left-1/2 top-0 h-2 w-5 -translate-x-1/2 rounded-full bg-background/95" />
      <div className="absolute left-1/2 top-1 h-1.5 w-3 -translate-x-1/2 rounded-sm bg-background/95" />
      {/* Head */}
      <div className="absolute bottom-0 left-1/2 flex h-6 w-7 -translate-x-1/2 items-center justify-center gap-1 rounded-[10px] bg-background/95">
        <motion.span
          className="block h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.92, 0.96, 1] }}
        />
        <motion.span
          className="block h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.92, 0.96, 1] }}
        />
      </div>
    </motion.div>
  )
}

export function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [showGreeting, setShowGreeting] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi, I'm Chef — your AI restaurant co-pilot. Ask me anything about tonight's service." },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  // Chef peeks in with a greeting shortly after load, then tucks away.
  useEffect(() => {
    if (open) return
    const show = setTimeout(() => setShowGreeting(true), 2600)
    const hide = setTimeout(() => setShowGreeting(false), 9000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [open])

  function send(text: string) {
    const value = text.trim()
    if (!value) return
    const reply = cannedReplies[value] || cannedReplies.default
    setMessages((m) => [...m, { role: "user", text: value }, { role: "ai", text: reply }])
    setInput("")
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15">
                <ChefRobot />
              </div>
              <div className="flex-1">
                <p className="font-serif text-base font-semibold">Chef AI</p>
                <p className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online · Smart mode
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-primary-foreground/15" aria-label="Close assistant">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-thin p-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {quickPrompts.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => send(q.label)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
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
                  placeholder="Ask Chef anything..."
                  className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button type="submit" className="rounded-lg bg-primary p-2 text-primary-foreground transition-transform hover:scale-105" aria-label="Send">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGreeting && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed bottom-7 right-24 z-50 max-w-[200px] rounded-2xl rounded-br-sm border border-border bg-card px-3.5 py-2.5 text-sm shadow-soft"
          >
            <p className="font-medium text-foreground">Need a hand tonight?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Ask me about sales, stock, or prep.</p>
            <span className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 border-b border-r border-border bg-card" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        animate={open ? { x: 0 } : { x: [0, -2, 0, 2, 0] }}
        transition={open ? {} : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
        aria-label="Open Chef AI assistant"
      >
        <motion.span
          className="absolute inset-0 rounded-2xl bg-primary"
          animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="relative z-10">{open ? <X className="h-6 w-6" /> : <ChefRobot />}</span>
        <span className="absolute -right-0.5 -top-0.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-copper text-[9px] font-bold text-copper-foreground ring-2 ring-background">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
      </motion.button>
    </>
  )
}
