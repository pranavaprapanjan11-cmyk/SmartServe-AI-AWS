import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';

interface Item {
  name: string;
  price?: number | null;
  category?: string | null;
  raw?: string;
  confidence?: number;
}

export default function OCRReview() {
  const loc = useLocation();
  const navigate = useNavigate();
  const state = (loc.state as any) || {};
  const fileId = state.fileId as string | undefined;
  const previewUrl = state.previewUrl as string | undefined;
  const fileName = state.fileName as string | undefined;
  const fileType = state.fileType as string | undefined;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [rawOcrText, setRawOcrText] = useState<string>('');

  const [engine, setEngine] = useState<string>('');
  const [imageVersion, setImageVersion] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [debugImages, setDebugImages] = useState<{
    original: string;
    processed_a: string;
    processed_b: string;
    processed_c: string;
  } | null>(null);
  const [activeGalleryTab, setActiveGalleryTab] = useState<'original' | 'processed_a' | 'processed_b' | 'processed_c'>('original');

  const [easyocrText, setEasyocrText] = useState<string>('');
  const [easyocrConfidence, setEasyocrConfidence] = useState<number>(0);
  const [easyocrError, setEasyocrError] = useState<string | null>(null);
  const [tesseractText, setTesseractText] = useState<string>('');
  const [tesseractConfidence, setTesseractConfidence] = useState<number>(0);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const serverBase = API_BASE.replace(/\/api$/, '');

  const getImageUrl = (pathStr: string) => {
    if (!pathStr) return '';
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;
    return `${serverBase}${pathStr}`;
  };

  // Fetch health status on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/ocr/health`);
        setHealthStatus(res.data);
      } catch (err) {
        console.error('Failed to fetch OCR pipeline health status:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!fileId) return;
    (async () => {
      setLoading(true);
      setErrors([]);
      try {
        const res = await axios.post(`${API_BASE}/ocr/parse`, { fileId });
        if (res.data && Array.isArray(res.data.items)) {
          setItems(res.data.items.map((item: any) => ({
            name: String(item.name || '').trim(),
            price: item.price != null ? Number(item.price) : null,
            category: item.category || 'Uncategorized',
            confidence: Number(item.confidence ?? 0),
            raw: item.raw,
          })));
          setErrors(res.data.errors || []);
          setRawOcrText(res.data.rawText || '');
          setEngine(res.data.engine || '');
          setImageVersion(res.data.imageVersion || '');
          setConfidence(res.data.confidence ?? 0);
          setDebugImages(res.data.debugImages || null);
          setEasyocrText(res.data.easyocrText || '');
          setEasyocrConfidence(res.data.easyocrConfidence ?? 0);
          setEasyocrError(res.data.easyocrError || null);
          setTesseractText(res.data.tesseractText || '');
          setTesseractConfidence(res.data.tesseractConfidence ?? 0);
          if (res.data.imageVersion && ['original', 'processed_a', 'processed_b', 'processed_c'].includes(res.data.imageVersion)) {
            setActiveGalleryTab(res.data.imageVersion);
          }
        } else {
          setErrors(['No menu items were extracted.']);
        }
      } catch (err: any) {
        setErrors([err.response?.data?.message || err.message || 'OCR parse failed']);
      } finally {
        setLoading(false);
      }
    })();
  }, [fileId]);

  const totalItems = items.length;
  const averageConfidence = useMemo(() => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + (item.confidence || 0), 0);
    return total / items.length;
  }, [items]);

  const detectedCategories = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.category || 'Uncategorized'))).filter(Boolean);
  }, [items]);

  function updateItem(idx: number, key: keyof Item, value: any) {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [key]: value } as Item;
    setItems(copy);
  }

  function handleRescan() {
    navigate('/ocr/upload');
  }

  function handleSaveDraft() {
    const draftKey = fileId ? `ocr-draft-${fileId}` : 'ocr-draft';
    localStorage.setItem(draftKey, JSON.stringify(items));
    setMessage('Draft saved locally. You can continue later.');
  }

  async function handleImport() {
    if (items.length === 0) return alert('No items to import');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.post(`${API_BASE}/ocr/import`, { items }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Imported ${res.data.created.length} items`);
      navigate('/menu');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Import failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Block */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">OCR Review Pipeline</span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Review Extracted Items
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Confirm extracted names, prices, and categories from our multi-engine OCR runner.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
              {healthStatus && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                  healthStatus.easyocr
                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${healthStatus.easyocr ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {healthStatus.easyocr ? 'EasyOCR Active' : 'EasyOCR Failed'}
                </span>
              )}
              <span className="rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
                Total Items: <span className="font-bold text-cyan-400">{totalItems}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Layout: Grid of Left Column (Gallery, Engine Info, Raw OCR) and Right Column (Table & Actions) */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Gallery + Engine Info + Raw OCR */}
          <div className="space-y-8 lg:col-span-5">
            
            {/* SECTION 1: Upload Preview & Processed Images Gallery */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Image Processing Gallery
              </h2>
              
              {/* Main Image Display */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-950 flex items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    <span className="text-xs font-mono">Running OCR pipeline...</span>
                  </div>
                ) : debugImages ? (
                  <img
                    src={getImageUrl(debugImages[activeGalleryTab])}
                    alt={`${activeGalleryTab} preview`}
                    className="h-full w-full object-contain transition-all duration-300"
                  />
                ) : previewUrl && fileType?.startsWith('image/') ? (
                  <img src={previewUrl} alt="Menu preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">
                    PDF or non-image format preview.
                  </div>
                )}
                
                {/* Active Tag Label Overlay */}
                <div className="absolute right-3 top-3 rounded-lg bg-slate-950/80 px-2.5 py-1 text-2xs font-mono text-cyan-300 border border-cyan-400/20 backdrop-blur-sm uppercase">
                  {activeGalleryTab}
                </div>
              </div>

              {/* Thumbnail Selector Grid */}
              {debugImages && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(['original', 'processed_a', 'processed_b', 'processed_c'] as const).map((tab) => {
                    const isActive = activeGalleryTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveGalleryTab(tab)}
                        className={`group relative flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-400/5 text-cyan-300'
                            : 'border-white/5 bg-slate-950/50 text-slate-400 hover:border-white/10 hover:text-slate-200'
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
                          {tab.replace('_', ' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: OCR Engine Info */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                OCR Engine Analysis
              </h2>
              
              {loading ? (
                <div className="py-4 text-center text-sm text-slate-500 font-mono">Analyzing input...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Engine Chosen</span>
                      <p className="mt-1 text-sm font-semibold text-cyan-300">{engine || 'Tesseract CLI'}</p>
                    </div>
                    
                    <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Best Image Version</span>
                      <p className="mt-1 text-sm font-semibold text-indigo-300 capitalize">{imageVersion ? imageVersion.replace('_', ' ') : 'Default'}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Pipeline Confidence</span>
                      <span className={`text-xs font-bold ${
                        confidence >= 0.8
                          ? 'text-emerald-400'
                          : confidence >= 0.5
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {Math.round(confidence * 100)}% Match
                      </span>
                    </div>
                    {/* Confidence Meter Bar */}
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          confidence >= 0.8
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : confidence >= 0.5
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-rose-500 to-red-400'
                        }`}
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Raw OCR Output */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Selected Raw Output
              </h2>
              
              <div className="mt-2 w-full rounded-2xl border border-white/5 bg-slate-950 p-4 text-xs font-mono text-slate-300 overflow-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                {rawOcrText || 'No raw text output available.'}
              </div>
            </div>
            
          </div>

          {/* RIGHT COLUMN: Table, Warnings, Action buttons */}
          <div className="space-y-8 lg:col-span-7">
            
            {/* EasyOCR Error Detailed Banner */}
            {easyocrError && (
              <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-100 backdrop-blur-xl">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>EasyOCR Execution Exception</span>
                </div>
                <p className="mt-2 text-2xs text-rose-200/90 leading-relaxed font-mono whitespace-pre-wrap max-h-36 overflow-y-auto bg-slate-950/60 p-3 rounded-lg border border-rose-500/10">
                  {easyocrError}
                </p>
                <p className="mt-2 text-2xs text-slate-400">
                  * EasyOCR execution failed. The pipeline automatically utilized Tesseract CLI as a fallback.
                </p>
              </div>
            )}

            {/* Warnings Panel */}
            {errors.length > 0 && (
              <div className="rounded-[1.5rem] border border-orange-500/20 bg-orange-500/10 p-5 text-sm text-orange-100 backdrop-blur-xl">
                <div className="flex items-center gap-2 font-semibold">
                  <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Parsing Warnings</span>
                </div>
                <ul className="mt-3 list-disc space-y-1.5 pl-6 text-xs text-orange-200/90">
                  {errors.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
              </div>
            )}

            {/* Extracted Items */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Extracted Dishes</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Edit the fields directly to refine. Bestsellers or new items will be added.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setItems([...items, { name: 'New Dish', price: 0, category: 'Uncategorized', confidence: 1.0 }])}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  + Add Row
                </button>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/80">
                <table className="min-w-full divide-y divide-white/5 text-sm">
                  <thead className="bg-slate-900/60 font-medium text-slate-400">
                    <tr>
                      <th className="px-4 py-3.5 text-left">Dish Name</th>
                      <th className="px-4 py-3.5 text-left">Category</th>
                      <th className="px-4 py-3.5 text-left">Price (₹)</th>
                      <th className="px-4 py-3.5 text-left">Confidence</th>
                      <th className="px-4 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-xs">
                          Parsing receipt menu items...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-xs">
                          No menu items detected.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={`${item.name}-${index}`} className="hover:bg-white/1">
                          
                          {/* Dish Name */}
                          <td className="px-4 py-3">
                            <input
                              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                            />
                          </td>
                          
                          {/* Category */}
                          <td className="px-4 py-3">
                            <input
                              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                              value={item.category || ''}
                              onChange={(e) => updateItem(index, 'category', e.target.value)}
                            />
                          </td>
                          
                          {/* Price */}
                          <td className="px-4 py-3">
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs text-slate-500">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="w-full rounded-xl border border-white/10 bg-slate-900 pl-7 pr-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                                value={item.price != null ? item.price : ''}
                                onChange={(e) => updateItem(index, 'price', e.target.value ? Number(e.target.value) : null)}
                              />
                            </div>
                          </td>
                          
                          {/* Confidence */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-bold border ${
                              (item.confidence ?? 0) >= 0.8
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                                : (item.confidence ?? 0) >= 0.5
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                            }`}>
                              {item.confidence != null ? `${Math.round(item.confidence * 100)}%` : '—'}
                            </span>
                          </td>

                          {/* Actions (Delete Row) */}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...items];
                                copy.splice(index, 1);
                                setItems(copy);
                              }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                            >
                              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                          
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-6">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleRescan}
                    className="rounded-full border border-white/10 bg-slate-900 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                  >
                    Re-Scan Image
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-6 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    Save Draft
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || items.length === 0}
                  className="rounded-full bg-cyan-400 px-8 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-cyan-400/15 transition-all"
                >
                  Import Menu Items
                </button>
              </div>

              {message && (
                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs font-semibold text-cyan-300">
                  {message}
                </div>
              )}
            </div>
            
          </div>
          
        </div>

        {/* SECTION: Manual OCR Compare Panel */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/30 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Manual OCR Compare Panel
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Column 1: EasyOCR */}
            <div className="flex flex-col rounded-2xl border border-white/5 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">EasyOCR Candidate</span>
                {easyocrConfidence > 0 && (
                  <span className="text-2xs font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">
                    Conf: {Math.round(easyocrConfidence * 100)}%
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto max-h-80 min-h-[12rem] text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                {easyocrError ? (
                  <div className="text-rose-400 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 whitespace-pre-wrap font-mono">
                    <span className="font-bold uppercase tracking-wider block mb-1 text-[10px]">Error Details:</span>
                    {easyocrError}
                  </div>
                ) : (
                  easyocrText || 'No EasyOCR text returned.'
                )}
              </div>
            </div>
            
            {/* Column 2: Tesseract */}
            <div className="flex flex-col rounded-2xl border border-white/5 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Tesseract Candidate</span>
                {tesseractConfidence > 0 && (
                  <span className="text-2xs font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Conf: {Math.round(tesseractConfidence * 100)}%
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto max-h-80 min-h-[12rem] text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                {tesseractText || 'No Tesseract text returned.'}
              </div>
            </div>
            
            {/* Column 3: Selected Result */}
            <div className="flex flex-col rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 ring-1 ring-cyan-500/10">
              <div className="flex items-center justify-between mb-3 border-b border-cyan-500/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Selected Output</span>
                <span className="text-2xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {engine} ({Math.round(confidence * 100)}%)
                </span>
              </div>
              <div className="flex-1 overflow-auto max-h-80 min-h-[12rem] text-xs font-mono text-emerald-200/90 leading-relaxed whitespace-pre-wrap">
                {rawOcrText || 'No selected text available.'}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
