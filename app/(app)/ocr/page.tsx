"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { FileText, ArrowRight, Zap, Image as ImageIcon, CheckCircle, Database } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function OcrPanel() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="OCR Menu Scanner"
        description="Extract and import restaurant menus automatically using advanced OCR preprocessing"
      >
        <Badge variant="success" className="gap-1.5 px-3 py-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Multi-Engine Ready
        </Badge>
      </PageHeader>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-border bg-card/60 p-8 shadow-xl backdrop-blur-xl"
      >
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">OCR Menu Import</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Extract restaurant menus with intelligent OCR.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
              Upload a photo or PDF of a menu and let the system detect dishes, prices, and categories automatically.
            </p>
          </div>

          <div className="rounded-full bg-primary/10 px-5 py-3 text-sm font-medium text-primary ring-1 ring-primary/20 self-start xl:self-auto">
            Production-ready OCR workflow
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="bg-[#0c101c]/40 border-border/60">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Fast menu capture
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                AI-assisted extraction for print and photographed menus, calibrated for restaurant pricing tables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  OpenCV preprocessing for clear text
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  EasyOCR extraction plus correction layer
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Structured dish, price, category output
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Editable review and import workflow
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-[#0c101c]/40 border-border/60 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Get started
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Drop a JPG, PNG, or PDF and let the OCR pipeline return a clean menu draft for review.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/ocr/upload" passHref>
                <Button size="lg" className="w-full sm:w-auto rounded-full font-semibold gap-2 shadow-lg shadow-primary/10">
                  Upload Menu Image <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </div>
  )
}
