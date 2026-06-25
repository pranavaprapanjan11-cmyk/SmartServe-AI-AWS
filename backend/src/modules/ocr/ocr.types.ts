export interface ExtractedItem {
  name: string;
  price?: number | null;
  category?: string | null;
  raw?: string;
  confidence?: number;
}

export interface OCRParseResult {
  items: ExtractedItem[];
  errors?: string[];
  rawText?: string;
  confidence?: number;
  engine?: string;
  imageVersion?: string;
  debugImages?: {
    original: string;
    processed_a: string;
    processed_b: string;
    processed_c: string;
  };
  easyocrText?: string;
  easyocrConfidence?: number;
  easyocrError?: string | null;
  tesseractText?: string;
  tesseractConfidence?: number;
}
