"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FileText, Upload, AlertCircle, ArrowRight, HelpCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import * as ocrService from "@/lib/services/ocrService"

export default function OCRUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [file])

  const fileLabel = useMemo(() => {
    if (!file) return "No file selected"
    return `${file.name} • ${(file.size / 1024).toFixed(1)} KB`
  }, [file])

  function handleFileChange(files: FileList | null) {
    if (!files?.[0]) return
    const selectedFile = files[0]
    const ext = selectedFile.name.split(".").pop()?.toLowerCase()
    if (!ext || !["jpg", "jpeg", "png", "webp", "pdf"].includes(ext)) {
      toast.error("Unsupported file type. Please select a JPG, PNG, or PDF.")
      return
    }
    setFile(selectedFile)
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error("Select a file to upload")
      return
    }
    setLoading(true)
    const uploadToast = toast.loading("Uploading and initiating OCR pipeline...")
    
    try {
      const res = await ocrService.uploadMenuFile(file)
      
      // Store variables in sessionStorage for OCRReview
      sessionStorage.setItem("ocr_fileId", res.fileId)
      sessionStorage.setItem("ocr_fileName", file.name)
      sessionStorage.setItem("ocr_fileType", file.type)
      
      if (previewUrl) {
        sessionStorage.setItem("ocr_previewUrl", previewUrl)
      } else {
        sessionStorage.removeItem("ocr_previewUrl")
      }

      toast.success("File uploaded successfully! Starting menu parsing.", { id: uploadToast })
      router.push("/ocr/review")
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.message || err.message || "Upload failed"
      toast.error(errorMsg, { id: uploadToast })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upload Menu"
        description="Drop or select a menu file to begin automatic extraction"
      />

      <div className="rounded-[2rem] border border-border bg-card/60 p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/50 pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">OCR Menu Import</span>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Drop your menu photo or PDF.</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Supported files: JPG, PNG, PDF. The OCR pipeline will preprocess and extract dishes and prices.
            </p>
          </div>
          <Badge variant="outline" className="px-4 py-2 bg-primary/5 text-primary border-primary/20 text-xs self-start md:self-auto rounded-full">
            Smart Menu Import
          </Badge>
        </div>

        <form onSubmit={handleUpload} className="mt-8 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`group relative rounded-[1.75rem] border-2 border-dashed transition-all duration-300 ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border bg-muted/20 hover:border-muted-foreground/30"
            }`}
          >
            <label className="flex min-h-[260px] flex-col items-center justify-center gap-4 p-8 text-center cursor-pointer">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Drag & drop your menu here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse files</p>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground/60 font-mono">
                  JPG • PNG • PDF
                </p>
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => handleFileChange(e.target.files)}
                disabled={loading}
              />
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="bg-muted/10 border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Selected file</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {fileLabel}
                </div>
                {previewUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-slate-950 flex items-center justify-center p-2">
                    <img
                      src={previewUrl}
                      alt="Selected menu preview"
                      className="h-48 w-full object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/5 p-6 text-center text-sm text-muted-foreground">
                    Image preview will appear here for supported image uploads.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Tips for better OCR</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold">1</span>
                    <span>Use clear, high-resolution photos with even lighting.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold">2</span>
                    <span>Avoid tilted pages, severe angles, or camera glare.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold">3</span>
                    <span>Prefer printed menus or clean text over handwriting.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold">4</span>
                    <span>Verify and adjust prices or names on the next step.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-6">
            <Button
              type="submit"
              disabled={loading || !file}
              size="lg"
              className="rounded-full px-8 font-semibold gap-2"
            >
              {loading ? "Uploading…" : "Upload & Parse"} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              After upload, you will review extracted dishes and prices before importing them into your menu database.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
