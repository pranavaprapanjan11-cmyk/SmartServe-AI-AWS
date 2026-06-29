"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Activity,
  AlertTriangle,
  Image as ImageIcon,
  Cpu,
  Layers,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Loader2,
  Calendar,
  Building,
  Hash,
  DollarSign
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { API_BASE } from "@/lib/config"
import * as ocrService from "@/lib/services/ocrService"
import { cn } from "@/lib/utils"

export default function OCRReviewPage() {
  const router = useRouter()
  const { token } = useAuth()

  // Session Storage values
  const [fileId, setFileId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)

  // API Data States
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState<string>("")
  const [rawOcrText, setRawOcrText] = useState<string>("")

  // Invoice Specific States
  const [supplierName, setSupplierName] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("")
  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)
  const [confidenceIssues, setConfidenceIssues] = useState<string[]>([])

  // Engine States
  const [engine, setEngine] = useState<string>("")
  const [imageVersion, setImageVersion] = useState<string>("")
  const [confidence, setConfidence] = useState<number>(0)
  const [debugImages, setDebugImages] = useState<{
    original: string;
    processed_a: string;
    processed_b: string;
    processed_c: string;
  } | null>(null)
  const [activeGalleryTab, setActiveGalleryTab] = useState<"original" | "processed_a" | "processed_b" | "processed_c">("original")

  // Comparison stats
  const [easyocrText, setEasyocrText] = useState<string>("")
  const [easyocrConfidence, setEasyocrConfidence] = useState<number>(0)
  const [easyocrError, setEasyocrError] = useState<string | null>(null)
  const [tesseractText, setTesseractText] = useState<string>("")
  const [tesseractConfidence, setTesseractConfidence] = useState<number>(0)
  const [healthStatus, setHealthStatus] = useState<ocrService.OcrHealthStatus | null>(null)

  // Mode Selection: "invoice" (Inventory Stock) or "menu" (Dishes)
  const [reviewMode, setReviewMode] = useState<"invoice" | "menu">("invoice")

  const serverBase = useMemo(() => {
    return API_BASE.replace(/\/api$/, "")
  }, [])

  const getImageUrl = (pathStr: string) => {
    if (!pathStr) return ""
    if (pathStr.startsWith("http://") || pathStr.startsWith("https://")) return pathStr
    return `${serverBase}${pathStr}`
  }

  // Load session state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setFileId(sessionStorage.getItem("ocr_fileId"))
      setPreviewUrl(sessionStorage.getItem("ocr_previewUrl"))
      setFileName(sessionStorage.getItem("ocr_fileName"))
      setFileType(sessionStorage.getItem("ocr_fileType"))
    }
  }, [])

  // Fetch health status on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await ocrService.getOcrHealth()
        setHealthStatus(data)
      } catch (err) {
        console.error("Failed to fetch OCR pipeline health status:", err)
      }
    }
    fetchHealth()
  }, [])

  // Parse menu file when fileId and token are loaded
  useEffect(() => {
    if (!fileId || !token) return

    const parseFile = async () => {
      setLoading(true)
      setErrors([])
      const parseToast = toast.loading("Running Gemini document understanding...")
      try {
        const res = await ocrService.parseMenuFile(fileId, token)
        
        if (res && res.success && res.data) {
          const docData = res.data
          setSupplierName(docData.supplierName || "")
          setInvoiceNumber(docData.invoiceNumber || "")
          setInvoiceDate(docData.invoiceDate || "")
          setSubtotal(Number(docData.subtotal || 0))
          setTax(Number(docData.tax || 0))
          setGrandTotal(Number(docData.grandTotal || 0))
          setConfidence(Number(docData.confidence ?? 0.9))
          setConfidenceIssues(docData.confidenceIssues || [])
          
          if (docData.items && Array.isArray(docData.items)) {
            setItems(
              docData.items.map((item: any) => ({
                name: String(item.name || "").trim(),
                price: item.unitPrice != null ? Number(item.unitPrice) : null,
                category: item.category || "Uncategorized",
                confidence: Number(docData.confidence ?? 0.9),
                quantity: Number(item.quantity || 1),
                unitPrice: item.unitPrice != null ? Number(item.unitPrice) : 0,
                totalPrice: item.totalPrice != null ? Number(item.totalPrice) : 0
              }))
            )
            setErrors([])
            setEngine("Gemini 2.5 Flash")
            setImageVersion("original")
            setRawOcrText(JSON.stringify(docData, null, 2))
            toast.success("Document analyzed successfully!", { id: parseToast })
            
            // Auto detect tab based on contents
            if (docData.invoiceNumber || docData.invoiceDate || docData.tax > 0) {
              setReviewMode("invoice")
            } else {
              setReviewMode("menu")
            }
          } else {
            setErrors(["No items were extracted."])
            toast.warning("Gemini completed, but no items were extracted.", { id: parseToast })
          }
        } else {
          setErrors(["No structured data returned."])
          toast.warning("Gemini completed, but returned empty fields.", { id: parseToast })
        }
      } catch (err: any) {
        console.error(err)
        const errorMsg = err.response?.data?.message || err.message || "OCR parse failed"
        setErrors([errorMsg])
        toast.error(errorMsg, { id: parseToast })
      } finally {
        setLoading(false)
      }
    }

    parseFile()
  }, [fileId, token])

  const totalItems = items.length
  const averageConfidence = useMemo(() => {
    if (items.length === 0) return 0
    const total = items.reduce((sum, item) => sum + (item.confidence || 0), 0)
    return total / items.length
  }, [items])

  function updateItem(idx: number, key: string, value: any) {
    const copy = [...items]
    copy[idx] = { ...copy[idx], [key]: value }
    
    // Auto-compute total price if quantity or unitPrice changes
    if (key === "quantity" || key === "unitPrice" || key === "price") {
      const q = Number(copy[idx].quantity || 1)
      const p = Number(copy[idx].unitPrice || copy[idx].price || 0)
      copy[idx].totalPrice = q * p
      
      // Update price back-compatibility
      if (key === "unitPrice") copy[idx].price = p
      if (key === "price") copy[idx].unitPrice = p
    }
    
    setItems(copy)

    // Recalculate invoice totals if in invoice mode
    if (reviewMode === "invoice") {
      const newSubtotal = copy.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
      setSubtotal(newSubtotal)
      setGrandTotal(newSubtotal + tax)
    }
  }

  function handleRescan() {
    router.push("/ocr/upload")
  }

  function handleSaveDraft() {
    const draftKey = fileId ? `ocr-draft-${fileId}` : "ocr-draft"
    localStorage.setItem(draftKey, JSON.stringify({
      reviewMode,
      supplierName,
      invoiceNumber,
      invoiceDate,
      subtotal,
      tax,
      grandTotal,
      items
    }))
    setMessage("Draft saved locally. You can continue later.")
    toast.success("Draft saved to local storage.")
  }

  // Confirm Invoice Flow (Updates Inventory)
  async function handleConfirmInvoice() {
    if (items.length === 0) {
      toast.error("No items to commit to stock.")
      return
    }
    if (!token) {
      toast.error("Authentication session missing. Please sign in.")
      return
    }

    setIsCommitting(true)
    const commitToast = toast.loading("Committing invoice items to inventory stock...")
    try {
      const payload = {
        supplierName,
        invoiceNumber,
        invoiceDate,
        subtotal,
        tax,
        grandTotal,
        items: items.map(it => ({
          name: it.name,
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || it.price || 0),
          totalPrice: Number(it.totalPrice || (it.quantity * (it.unitPrice || it.price || 0)))
        }))
      }

      const res = await ocrService.confirmInvoice(payload, token)
      toast.success(`Successfully onboarded inventory stock! Recorded PO #${res.purchaseOrder?.id || ''}`, { id: commitToast })
      
      // Clean up session storage
      sessionStorage.removeItem("ocr_fileId")
      sessionStorage.removeItem("ocr_fileName")
      sessionStorage.removeItem("ocr_fileType")
      sessionStorage.removeItem("ocr_previewUrl")

      // Dispatch update event for local components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("inventoryUpdated"))
      }
      
      router.push("/inventory")
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.message || err.message || "Inventory commit failed"
      toast.error(errorMsg, { id: commitToast })
    } finally {
      setIsCommitting(false)
    }
  }

  // Import Menu Items Flow
  async function handleImportMenu() {
    if (items.length === 0) {
      toast.error("No items to import")
      return
    }
    if (!token) {
      toast.error("Authentication session missing. Please sign in.")
      return
    }

    setIsCommitting(true)
    const importToast = toast.loading("Importing items to Menu Matrix...")
    try {
      const res = await ocrService.importMenuItems(items, token)
      toast.success(`Successfully imported ${res.created.length} new items into the menu database!`, { id: importToast })
      
      // Clean up session storage
      sessionStorage.removeItem("ocr_fileId")
      sessionStorage.removeItem("ocr_fileName")
      sessionStorage.removeItem("ocr_fileType")
      sessionStorage.removeItem("ocr_previewUrl")
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("menuUpdated"))
      }
      
      router.push("/menu")
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.message || err.message || "Import failed"
      toast.error(errorMsg, { id: importToast })
    } finally {
      setIsCommitting(false)
    }
  }

  if (!fileId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Review Extracted Items" description="OCR Document Parsing Panel" />
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No menu or invoice scan in progress</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                To review OCR extraction, you must first upload an invoice image or PDF file.
              </p>
            </div>
            <Button onClick={() => router.push("/ocr/upload")} className="rounded-full mt-2 font-semibold">
              Go to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card/60 p-8 backdrop-blur-xl">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">OCR Review Pipeline</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Review Extracted Items
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Confirm details, edit fields, and commit data to inventory or the menu database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {healthStatus && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
                  healthStatus.easyocr
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", healthStatus.easyocr ? "bg-emerald-400" : "bg-rose-400")} />
                {healthStatus.easyocr ? "EasyOCR Ready" : "EasyOCR Offline"}
              </span>
            )}
            <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-foreground">
              Total Items: <span className="font-bold text-primary">{totalItems}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Left Column (Preview) and Right Column (Table & Actions) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Gallery & Document Preview */}
        <div className="space-y-8 lg:col-span-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4.5 w-4.5 text-primary" /> Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-slate-950 flex items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs font-mono">Running Gemini understanding...</span>
                  </div>
                ) : previewUrl && fileType?.startsWith("image/") ? (
                  <img src={previewUrl} alt="Invoice preview" className="h-full w-full object-contain" />
                ) : previewUrl ? (
                  <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <span>PDF Document Uploaded</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-xs">{fileName}</span>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No preview available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Engine Confidence */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-primary" /> Document Confidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground font-mono">Analyzing layout...</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-slate-950/40 p-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Parser Engine</span>
                    <p className="text-sm font-semibold text-primary">{engine || "Gemini 2.5"}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Math Integrity</span>
                      <span
                        className={cn(
                          "text-xs font-bold",
                          confidence >= 0.8 ? "text-emerald-400" : confidence >= 0.5 ? "text-amber-400" : "text-rose-400"
                        )}
                      >
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          confidence >= 0.8
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : confidence >= 0.5
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-rose-500 to-red-400"
                        )}
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive Fields and Table */}
        <div className="space-y-8 lg:col-span-8">
          {/* Tabs for choosing Mode */}
          <div className="flex gap-2 p-1.5 border border-border rounded-2xl bg-[#0c101c]/40 w-fit">
            <button
              onClick={() => setReviewMode("invoice")}
              disabled={loading}
              className={cn(
                "px-5 py-2.5 text-xs font-semibold rounded-xl transition-all",
                reviewMode === "invoice"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground disabled:opacity-50"
              )}
            >
              Inventory Stock Refill (Invoice)
            </button>
            <button
              onClick={() => setReviewMode("menu")}
              disabled={loading}
              className={cn(
                "px-5 py-2.5 text-xs font-semibold rounded-xl transition-all",
                reviewMode === "menu"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground disabled:opacity-50"
              )}
            >
              Menu Matrix Import (Dishes)
            </button>
          </div>

          {/* Confidence/Validation Warnings */}
          {!loading && confidenceIssues.length > 0 && reviewMode === "invoice" && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-100 backdrop-blur-xl">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <span>Invoice Integrity Warnings</span>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-xs text-rose-200/90 leading-relaxed">
                {confidenceIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Document metadata block */}
          {reviewMode === "invoice" && (
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
              <CardHeader className="py-4 border-b border-border/50">
                <CardTitle className="text-base font-semibold text-foreground">Invoice Metadata</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Extracted invoice identifiers and supplier details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-primary" /> Supplier Name
                  </label>
                  <Input
                    value={supplierName}
                    disabled={loading}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Supplier Name..."
                    className="h-10 bg-background border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-indigo-400" /> Invoice Number
                  </label>
                  <Input
                    value={invoiceNumber}
                    disabled={loading}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Invoice Number..."
                    className="h-10 bg-background border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Invoice Date
                  </label>
                  <Input
                    type="date"
                    value={invoiceDate ? invoiceDate.substring(0, 10) : ""}
                    disabled={loading}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="h-10 bg-background border-border"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* MAIN REVIEW TABLE */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {reviewMode === "invoice" ? "Invoice Line Items" : "Extracted Dishes"}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs mt-0.5">
                  {reviewMode === "invoice"
                    ? "Verify ingredient names, quantities, and rates before adjusting raw stock."
                    : "Edit fields directly to refine. Dishes will be uploaded to your active Menu Matrix."}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => {
                  if (reviewMode === "invoice") {
                    setItems([...items, { name: "New Ingredient", quantity: 1, unitPrice: 0, totalPrice: 0, confidence: 1.0 }])
                  } else {
                    setItems([...items, { name: "New Dish", price: 0, category: "Uncategorized", confidence: 1.0 }])
                  }
                }}
                className="rounded-full gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-border bg-slate-950/80">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground">Item Name</TableHead>
                      {reviewMode === "menu" ? (
                        <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground">Category</TableHead>
                      ) : (
                        <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground w-24">Qty</TableHead>
                      )}
                      <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground w-32">
                        {reviewMode === "invoice" ? "Rate (₹)" : "Price (₹)"}
                      </TableHead>
                      {reviewMode === "invoice" && (
                        <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground w-32">Total (₹)</TableHead>
                      )}
                      <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground w-28">Confidence</TableHead>
                      <TableHead className="px-4 py-3.5 text-center font-medium text-muted-foreground w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={reviewMode === "invoice" ? 6 : 5} className="p-8 text-center text-muted-foreground font-mono text-xs">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Processing document data...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={reviewMode === "invoice" ? 6 : 5} className="p-8 text-center text-muted-foreground font-mono text-xs">
                          No items loaded. Add a row to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={`${item.name}-${index}`} className="hover:bg-muted/20">
                          {/* Item Name */}
                          <TableCell className="px-4 py-2">
                            <Input
                              className="h-9 w-full bg-background border-border"
                              value={item.name}
                              onChange={(e) => updateItem(index, "name", e.target.value)}
                            />
                          </TableCell>

                          {/* Category or Qty */}
                          {reviewMode === "menu" ? (
                            <TableCell className="px-4 py-2">
                              <Input
                                className="h-9 w-full bg-background border-border"
                                value={item.category || ""}
                                onChange={(e) => updateItem(index, "category", e.target.value)}
                              />
                            </TableCell>
                          ) : (
                            <TableCell className="px-4 py-2">
                              <Input
                                type="number"
                                min="1"
                                className="h-9 w-full bg-background border-border"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                              />
                            </TableCell>
                          )}

                          {/* Rate / Price */}
                          <TableCell className="px-4 py-2">
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                className="h-9 w-full pl-7 bg-background border-border"
                                value={item.unitPrice != null ? item.unitPrice : (item.price != null ? item.price : "")}
                                onChange={(e) => updateItem(index, "unitPrice", e.target.value ? Number(e.target.value) : 0)}
                              />
                            </div>
                          </TableCell>

                          {/* Total Price (Invoice only) */}
                          {reviewMode === "invoice" && (
                            <TableCell className="px-4 py-2 font-semibold text-xs text-foreground">
                              ₹{Number(item.totalPrice || 0).toLocaleString("en-IN")}
                            </TableCell>
                          )}

                          {/* Confidence */}
                          <TableCell className="px-4 py-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-semibold py-0.5 px-2",
                                (item.confidence ?? 0) >= 0.8
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : (item.confidence ?? 0) >= 0.5
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              )}
                            >
                              {item.confidence != null ? `${Math.round(item.confidence * 100)}%` : "—"}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-4 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const copy = [...items]
                                copy.splice(index, 1)
                                setItems(copy)
                                if (reviewMode === "invoice") {
                                  const nSub = copy.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0)
                                  setSubtotal(nSub)
                                  setGrandTotal(nSub + tax)
                                }
                              }}
                              className="h-8 w-8 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Invoice Totals grid (Invoice mode only) */}
              {!loading && reviewMode === "invoice" && (
                <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm border-t border-border/40 pt-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground items-center">
                    <span>Tax (GST/VAT):</span>
                    <Input
                      type="number"
                      value={tax}
                      onChange={(e) => {
                        const newTax = Number(e.target.value || 0)
                        setTax(newTax)
                        setGrandTotal(subtotal + newTax)
                      }}
                      className="w-24 h-8 text-right bg-background border-border"
                    />
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-border/40 pt-2 text-primary">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    disabled={loading || isCommitting}
                    onClick={handleRescan}
                    className="rounded-full gap-1.5 text-xs font-semibold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Re-Scan Image
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={loading || isCommitting}
                    onClick={handleSaveDraft}
                    className="rounded-full gap-1.5 text-xs font-semibold"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Draft
                  </Button>
                </div>

                {reviewMode === "invoice" ? (
                  <Button
                    onClick={handleConfirmInvoice}
                    disabled={loading || items.length === 0 || isCommitting}
                    className="rounded-full px-8 py-2.5 text-xs font-bold shadow-lg shadow-primary/10 gap-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Confirm & Commit Stock</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleImportMenu}
                    disabled={loading || items.length === 0 || isCommitting}
                    className="rounded-full px-8 py-2.5 text-xs font-bold shadow-lg shadow-primary/10 gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-600/95 hover:to-teal-500/95"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Import Menu Items</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {message && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs font-semibold text-primary">
                  {message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
