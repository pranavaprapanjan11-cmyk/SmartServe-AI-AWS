import axios from 'axios';
import { API_BASE } from '../config';

export interface OcrHealthStatus {
  easyocr: boolean;
  tesseract: boolean;
  torch: boolean;
}

export interface ExtractedItem {
  name: string;
  price?: number | null;
  category?: string | null;
  raw?: string;
  confidence?: number;
}

export interface OCRParseResult {
  engine: string;
  imageVersion?: string;
  confidence: number;
  easyocrConfidence?: number;
  tesseractConfidence?: number;
  rawText?: string;
  easyocrText?: string;
  tesseractText?: string;
  easyocrError?: string | null;
  items: ExtractedItem[];
  errors?: string[];
  debugImages?: {
    original: string;
    processed_a: string;
    processed_b: string;
    processed_c: string;
  } | null;
}

export async function uploadMenuFile(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await axios.post<{ fileId: string; originalName: string }>(
    `${API_BASE}/ocr/upload`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
}

export async function parseMenuFile(fileId: string, token: string) {
  const res = await axios.post<any>(
    `${API_BASE}/ocr/parse`,
    { fileId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function getOcrHealth() {
  const res = await axios.get<OcrHealthStatus>(`${API_BASE}/ocr/health`);
  return res.data;
}

export async function importMenuItems(items: ExtractedItem[], token: string) {
  const res = await axios.post<{ created: any[] }>(
    `${API_BASE}/ocr/import`,
    { items },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function confirmInvoice(payload: any, token: string) {
  const res = await axios.post<{ success: boolean; purchaseOrder: any }>(
    `${API_BASE}/ocr/confirm-invoice`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
