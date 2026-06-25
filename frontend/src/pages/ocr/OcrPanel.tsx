import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const OcrPanel: React.FC = () => {
  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl"
      >
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">OCR Menu Import</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Extract restaurant menus with intelligent OCR.</h1>
            <p className="mt-4 max-w-xl text-base text-slate-400">
              Upload a photo or PDF of a menu and let the system detect dishes, prices, and categories automatically.
            </p>
          </div>

          <div className="rounded-full bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100 ring-1 ring-cyan-400/20">
            Production-ready OCR workflow
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-8">
            <h2 className="text-lg font-semibold text-white">Fast menu capture</h2>
            <p className="mt-3 text-slate-400">AI-assisted extraction for print and photographed menus, calibrated for restaurant pricing tables.</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>• OpenCV preprocessing for clear text</li>
              <li>• EasyOCR extraction plus correction layer</li>
              <li>• Structured dish, price, category output</li>
              <li>• Editable review and import workflow</li>
            </ul>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-8">
            <h2 className="text-lg font-semibold text-white">Get started</h2>
            <p className="mt-3 text-slate-400">Drop a JPG, PNG, or PDF and let the OCR pipeline return a clean menu draft for review.</p>
            <Link
              to="/ocr/upload"
              className="mt-6 inline-flex rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Upload Menu Image
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default OcrPanel
