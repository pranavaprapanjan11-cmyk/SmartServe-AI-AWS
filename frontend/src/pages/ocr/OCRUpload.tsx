import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';

export default function OCRUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const fileLabel = useMemo(() => {
    if (!file) return 'No file selected';
    return `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
  }, [file]);

  function handleFileChange(files: FileList | null) {
    if (!files?.[0]) return;
    setFile(files[0]);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const dropped = event.dataTransfer.files;
    handleFileChange(dropped);
    setDragActive(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert('Select a file to upload');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API_BASE}/ocr/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileId = res.data.fileId;
      navigate('/ocr/review', { state: { fileId, previewUrl, fileName: file.name, fileType: file.type } });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">OCR Menu Import</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Drop your menu photo or PDF.</h1>
            <p className="mt-3 max-w-2xl text-slate-400">Supported files: JPG, PNG, PDF. The OCR pipeline will preprocess, extract dishes and prices, then take you to the review screen.</p>
          </div>
          <div className="rounded-3xl bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100 ring-1 ring-cyan-400/20">Smart menu import</div>
        </div>

        <form onSubmit={handleUpload} className="mt-8 space-y-6">
          <div
            className={`group relative rounded-[1.75rem] border-2 ${dragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 bg-slate-950/70'} transition-all duration-200`}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
            onDrop={handleDrop}
          >
            <label className="flex min-h-[240px] flex-col items-center justify-center gap-4 p-8 text-center text-slate-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-3xl text-cyan-300">⬆️</div>
              <div>
                <p className="text-lg font-semibold text-white">Drag & drop your menu here</p>
                <p className="mt-2 text-sm text-slate-400">or click to browse files</p>
                <p className="mt-3 text-xs uppercase tracking-[0.35em] text-slate-500">JPG PNG PDF</p>
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Selected file</p>
              <div className="mt-4 text-sm text-slate-200">{fileLabel}</div>
              {previewUrl ? (
                <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
                  <img src={previewUrl} alt="Selected menu preview" className="h-48 w-full object-contain" />
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-500">Image preview will appear here for supported image uploads.</div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Tips for better OCR</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>• Use clear photos with even lighting.</li>
                <li>• Avoid tilted pages or camera glare.</li>
                <li>• Prefer printed menus or high-contrast text.</li>
                <li>• Review and correct extracted items in the next step.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Uploading…' : 'Upload & Parse'}
            </button>
            <p className="text-sm text-slate-400">After upload, you will review extracted dishes and prices before import.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
