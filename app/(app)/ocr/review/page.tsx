"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
  Play,
  RotateCcw,
  Sparkles
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

export default function OCRReviewPage() {
  const router = useRouter()
  const { token } = useAuth()

  // Session Storage values
  const [fileId, setFileId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)

  // API Data States
  const [items, setItems] = useState<ocrService.ExtractedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState<string>("")
  const [rawOcrText, setRawOcrText] = useState<string>("")

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

  // Parse menu file when fileId is loaded
  useEffect(() => {
    if (!fileId) return

    const parseFile = async () => {
      setLoading(true)
      setErrors([])
      const parseToast = toast.loading("Running multi-engine OCR extraction...")
      try {
        const data = await ocrService.parseMenuFile(fileId)
        if (data && Array.isArray(data.items)) {
          setItems(
            data.items.map((item) => ({
              name: String(item.name || "").trim(),
              price: item.price != null ? Number(item.price) : null,
              category: item.category || "Uncategorized",
              confidence: Number(item.confidence ?? 0),
              raw: item.raw,
            }))
          )
          setErrors(data.errors || [])
          setRawOcrText(data.rawText || "")
          setEngine(data.engine || "")
          setImageVersion(data.imageVersion || "")
          setConfidence(data.confidence ?? 0)
          setDebugImages(data.debugImages || null)
          setEasyocrText(data.easyocrText || "")
          setEasyocrConfidence(data.easyocrConfidence ?? 0)
          setEasyocrError(data.easyocrError || null)
          setTesseractText(data.tesseractText || "")
          setTesseractConfidence(data.tesseractConfidence ?? 0)

          if (data.imageVersion && ["original", "processed_a", "processed_b", "processed_c"].includes(data.imageVersion)) {
            setActiveGalleryTab(data.imageVersion as any)
          }
          toast.success("OCR Menu extraction complete!", { id: parseToast })
        } else {
          setErrors(["No menu items were extracted."])
          toast.warning("OCR complete, but no menu items were extracted.", { id: parseToast })
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
  }, [fileId])

  const totalItems = items.length
  const averageConfidence = useMemo(() => {
    if (items.length === 0) return 0
    const total = items.reduce((sum, item) => sum + (item.confidence || 0), 0)
    return total / items.length
  }, [items])

  function updateItem(idx: number, key: keyof ocrService.ExtractedItem, value: any) {
    const copy = [...items]
    copy[idx] = { ...copy[idx], [key]: value } as ocrService.ExtractedItem
    setItems(copy)
  }

  function handleRescan() {
    router.push("/ocr/upload")
  }

  function handleSaveDraft() {
    const draftKey = fileId ? `ocr-draft-${fileId}` : "ocr-draft"
    localStorage.setItem(draftKey, JSON.stringify(items))
    setMessage("Draft saved locally. You can continue later.")
    toast.success("Draft saved to local storage.")
  }

  async function handleImport() {
    if (items.length === 0) {
      toast.error("No items to import")
      return
    }
    if (!token) {
      toast.error("Authentication session missing. Please sign in.")
      return
    }

    const importToast = toast.loading("Importing items to menu matrix...")
    try {
      const res = await ocrService.importMenuItems(items, token)
      toast.success(`Successfully imported ${res.created.length} new items into the menu database!`, { id: importToast })
      
      // Clean up session storage
      sessionStorage.removeItem("ocr_fileId")
      sessionStorage.removeItem("ocr_fileName")
      sessionStorage.removeItem("ocr_fileType")
      sessionStorage.removeItem("ocr_previewUrl")
      
      // Dispatch update event for local components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("menuUpdated"))
      }
      
      router.push("/inventory")
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.message || err.message || "Import failed"
      toast.error(errorMsg, { id: importToast })
    }
  }

  if (!fileId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Review Extracted Items" description="OCR Menu Parser Review Panel" />
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No menu scan in progress</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                To review OCR extraction, you must first upload a menu image or PDF file.
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
              Confirm extracted names, prices, and categories from our multi-engine OCR runner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {healthStatus && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                  healthStatus.easyocr
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${healthStatus.easyocr ? "bg-emerald-400" : "bg-rose-400"}`} />
                {healthStatus.easyocr ? "EasyOCR Active" : "EasyOCR Failed"}
              </span>
            )}
            <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-foreground">
              Total Items: <span className="font-bold text-primary">{totalItems}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Left Column (Gallery, Engine Info, Raw OCR) and Right Column (Table & Actions) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="space-y-8 lg:col-span-5">
          {/* Gallery */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4.5 w-4.5 text-primary" /> Image Processing Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-slate-950 flex items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs font-mono">Running OCR pipeline...</span>
                  </div>
                ) : debugImages ? (
                  <img
                    src={getImageUrl(debugImages[activeGalleryTab])}
                    alt={`${activeGalleryTab} preview`}
                    className="h-full w-full object-contain transition-all duration-300"
                  />
                ) : previewUrl && fileType?.startsWith("image/") ? (
                  <img src={previewUrl} alt="Menu preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    PDF or non-image format preview.
                  </div>
                )}

                <div className="absolute right-3 top-3 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-primary border border-primary/20 backdrop-blur-sm uppercase">
                  {activeGalleryTab}
                </div>
              </div>

              {debugImages && (
                <div className="grid grid-cols-4 gap-2">
                  {(["original", "processed_a", "processed_b", "processed_c"] as const).map((tab) => {
                    const isActive = activeGalleryTab === tab
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveGalleryTab(tab)}
                        className={`group relative flex flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all ${
                          isActive
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-slate-950/50 text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                        }`}
                      >
                        <div className="h-10 w-full overflow-hidden rounded-md bg-slate-900 flex items-center justify-center mb-1">
                          <img
                            src={getImageUrl(debugImages[tab])}
                            alt={tab}
                            className="h-full w-full object-cover opacity-80 group-hover:opacity-100"
                          />
                        </div>
                        <span className="text-[10px] font-medium capitalize truncate w-full">
                          {tab.replace("_", " ")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engine Analysis */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-primary" /> OCR Engine Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground font-mono">Analyzing input...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border bg-slate-950/40 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Engine Chosen</span>
                      <p className="mt-1 text-sm font-semibold text-primary">{engine || "Tesseract CLI"}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-slate-950/40 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Best Image Version</span>
                      <p className="mt-1 text-sm font-semibold text-indigo-400 capitalize">
                        {imageVersion ? imageVersion.replace("_", " ") : "Default"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pipeline Confidence</span>
                      <span
                        className={`text-xs font-bold ${
                          confidence >= 0.8 ? "text-emerald-400" : confidence >= 0.5 ? "text-amber-400" : "text-rose-400"
                        }`}
                      >
                        {Math.round(confidence * 100)}% Match
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          confidence >= 0.8
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : confidence >= 0.5
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-rose-500 to-red-400"
                        }`}
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Text */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" /> Selected Raw Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full rounded-xl border border-border bg-slate-950 p-4 text-xs font-mono text-muted-foreground overflow-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                {rawOcrText || "No raw text output available."}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8 lg:col-span-7">
          {/* EasyOCR Error Banner */}
          {easyocrError && (
            <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-100 backdrop-blur-xl">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <span>EasyOCR Execution Exception</span>
              </div>
              <p className="mt-2 text-xs text-rose-200/90 leading-relaxed font-mono whitespace-pre-wrap max-h-36 overflow-y-auto bg-slate-950/60 p-3 rounded-lg border border-rose-500/10">
                {easyocrError}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                * EasyOCR execution failed. The pipeline automatically utilized Tesseract CLI as a fallback.
              </p>
            </div>
          )}

          {/* Warnings Banner */}
          {errors.length > 0 && (
            <div className="rounded-[1.5rem] border border-warning/20 bg-warning/10 p-5 text-sm text-warning-foreground backdrop-blur-xl">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span>Parsing Warnings</span>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-xs text-warning-foreground/90">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Items Table */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Extracted Dishes</CardTitle>
                <CardDescription className="text-muted-foreground text-xs mt-0.5">
                  Edit fields directly to refine. Bestsellers or new items will be added.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItems([...items, { name: "New Dish", price: 0, category: "Uncategorized", confidence: 1.0 }])}
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
                      <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground">Dish Name</TableHead>
                      <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground">Category</TableHead>
                      <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground w-32">Price (₹)</TableHead>
                      <TableHead className="px-4 py-3.5 text-left font-medium text-muted-foreground w-28">Confidence</TableHead>
                      <TableHead className="px-4 py-3.5 text-center font-medium text-muted-foreground w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="p-8 text-center text-muted-foreground font-mono text-xs">
                          Parsing receipt menu items...
                        </TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="p-8 text-center text-muted-foreground font-mono text-xs">
                          No menu items detected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={`${item.name}-${index}`} className="hover:bg-muted/20">
                          {/* Dish Name */}
                          <TableCell className="px-4 py-2">
                            <Input
                              className="h-9 w-full bg-background border-border"
                              value={item.name}
                              onChange={(e) => updateItem(index, "name", e.target.value)}
                            />
                          </TableCell>

                          {/* Category */}
                          <TableCell className="px-4 py-2">
                            <Input
                              className="h-9 w-full bg-background border-border"
                              value={item.category || ""}
                              onChange={(e) => updateItem(index, "category", e.target.value)}
                            />
                          </TableCell>

                          {/* Price */}
                          <TableCell className="px-4 py-2">
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                className="h-9 w-full pl-7 bg-background border-border"
                                value={item.price != null ? item.price : ""}
                                onChange={(e) => updateItem(index, "price", e.target.value ? Number(e.target.value) : null)}
                              />
                            </div>
                          </TableCell>

                          {/* Confidence */}
                          <TableCell className="px-4 py-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold py-0.5 px-2 ${
                                (item.confidence ?? 0) >= 0.8
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : (item.confidence ?? 0) >= 0.5
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}
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

              {/* Action Buttons Footer */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleRescan} className="rounded-full gap-1.5 text-xs font-semibold">
                    <RotateCcw className="h-3.5 w-3.5" /> Re-Scan Image
                  </Button>
                  <Button variant="secondary" onClick={handleSaveDraft} className="rounded-full gap-1.5 text-xs font-semibold">
                    <Save className="h-3.5 w-3.5" /> Save Draft
                  </Button>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={loading || items.length === 0}
                  className="rounded-full px-8 py-2 text-xs font-bold shadow-lg shadow-primary/10 gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" /> Import Menu Items
                </Button>
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

      {/* Manual OCR Compare Panel */}
      <div className="rounded-[2rem] border border-border bg-card/40 p-8 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          Manual OCR Compare Panel
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {/* EasyOCR */}
          <div className="flex flex-col rounded-2xl border border-border bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> EasyOCR Candidate
              </span>
              {easyocrConfidence > 0 && (
                <Badge variant="outline" className="text-[10px] text-primary bg-primary/5 border-primary/20">
                  Conf: {Math.round(easyocrConfidence * 100)}%
                </Badge>
              )}
            </div>
            <div className="flex-1 overflow-auto max-h-80 min-h-[12rem] text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {easyocrError ? (
                <div className="text-rose-400 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 whitespace-pre-wrap font-mono">
                  <span className="font-bold uppercase tracking-wider block mb-1 text-[10px]">Error Details:</span>
                  {easyocrError}
                </div>
              ) : (
                easyocrText || "No EasyOCR text returned."
              )}
            </div>
          </div>

          {/* Tesseract */}
          <div className="flex flex-col rounded-2xl border border-border bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> Tesseract Candidate
              </span>
              {tesseractConfidence > 0 && (
                <Badge variant="outline" className="text-[10px] text-indigo-400 bg-indigo-500/5 border-indigo-500/20">
                  Conf: {Math.round(tesseractConfidence * 100)}%
                </Badge>
              )}
            </div>
            <div className="flex-1 overflow-auto max-h-80 min-h-[12rem] text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {tesseractText || "No Tesseract text returned."}
            </div>
          </div>

          {/* Selected Output */}
          <div className="flex flex-col rounded-2xl border border-primary/20 bg-primary/5 p-5 ring-1 ring-primary/10">
            <div className="flex items-center justify-between mb-3 border-b border-primary/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Selected Output
              </span>
              <Badge variant="outline" className="text-[10px] text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                {engine} ({Math.round(confidence * 100)}%)
              </Badge>
            </div>
            <div className="flex-1 overflow-auto max-h-80 min-h-[12rem] text-xs font-mono text-emerald-300/90 leading-relaxed whitespace-pre-wrap">
              {rawOcrText || "No selected text available."}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
