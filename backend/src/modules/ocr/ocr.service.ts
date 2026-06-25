import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import Tesseract from 'tesseract.js';
import { ExtractedItem, OCRParseResult } from './ocr.types';

const uploadDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const pythonCmd = process.env.PYTHON_PATH || 'python';
const pythonScript = path.join(process.cwd(), 'python', 'ocr_processor.py');

const PRICE_CHAR_MAP: Record<string, string> = {
  O: '0', o: '0', Q: '0', D: '0', B: '8', S: '5', s: '5', Z: '2', z: '2',
  I: '1', l: '1', i: '1', T: '7', t: '7', F: '7', f: '7', G: '9', g: '9',
  A: '4', a: '4', Y: '7', y: '7', U: '0', u: '0', X: '', x: ''
};

const NAME_CHAR_MAP: Record<string, string> = {
  '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S', '6': 'G', '7': 'T', '8': 'B', '2': 'Z'
};

const MENU_DICTIONARY = [
  'MOJITO', 'MILKSHAKE', 'BURGER', 'PIZZA', 'BIRYANI', 'FRIED', 'RICE', 'CHICKEN', 'COFFEE', 'TEA',
  'SAMOOSA', 'SAMOSA', 'DOSA', 'PASTA', 'SALAD', 'ICE', 'CREAM', 'SHAKE', 'SPAGHETTI', 'CURRY', 'NAAN',
  'DAL', 'VEG', 'VEGETABLE', 'MUTTON', 'FISH', 'SEAFOOD', 'SANDWICH', 'WRAP', 'HOT', 'DOG', 'NOODLE',
  'NOODLES', 'CAKE', 'BUN', 'ROLL', 'SOUP', 'NACHO', 'CHICKEN', 'MASALA', 'LEMONADE', 'COCKTAIL',
  'MOCKTAIL', 'LATTE', 'ESPRESSO', 'CAPPUCCINO', 'SMOOTHIE', 'SAUSAGE', 'FRIES', 'NUGGET', 'KEBAB',
  'PASTA', 'SPAGHETTI', 'RISOTTO', 'PUDDING', 'BROWNIE', 'SUNDAE', 'TART', 'PIE'
];

const SPECIAL_NAME_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bBiyani\b/i, 'Biryani'],
  [/\bBuge\b/i, 'Burger'],
  [/\bFied\b/i, 'Fried'],
  [/\bVeg Fied Ice\b/i, 'Veg Fried Rice'],
  [/\bFied Ice\b/i, 'Fried Rice'],
  [/\bIce\b/i, 'Rice'],
  [/\bM0JITO\b/i, 'Mojito'],
  [/\bMILKSHAKF\b/i, 'Milkshake'],
  [/\bMOJ1TO\b/i, 'Mojito'],
  [/\bMILKSHAK3\b/i, 'Milkshake'],
  [/\bCOFEE\b/i, 'Coffee'],
  [/\bP1ZZA\b/i, 'Pizza'],
  [/\bBURGER\b/i, 'Burger'],
  [/\bBIRIYANI\b/i, 'Biryani'],
  [/\bGUE\b/i, 'Ghee'],
  [/\bSO\b/i, '50'],
  [/\bFO\b/i, '70'],
  [/\bTO\b/i, '70'],
  [/\bZO\b/i, '20']
];

function detectCategory(name: string): string {
  const s = (name || '').toLowerCase();
  if (!s) return 'Uncategorized';
  if (/(coffee|tea|juice|shake|smoothie|mojito|latte|espresso|cappuccino|cocktail|mocktail|cola|lemonade|soda|beverage)/i.test(s)) return 'Beverages';
  if (/(burger|pizza|sandwich|fries|wrap|hot dog|hotdog|taco|nacho|shawarma|kebab|fast food|nugget)/i.test(s)) return 'Fast Food';
  if (/(biryani|rice|curry|thali|masala|naan|dal|paneer|chicken|mutton|fish|seafood|entree|main course|dosa|idli|vada|pasta|spaghetti|risotto)/i.test(s)) return 'Main Course';
  if (/(salad|dessert|ice cream|brownie|cake|gulab|jalebi|pudding|sweet|mousse|sundae|pie|tart)/i.test(s)) return 'Desserts';
  if (/(starter|snack|appetizer|roll|soup|kachori|pakora|samosa|spring roll|chips|nachos|bite)/i.test(s)) return 'Appetizers';
  return 'Uncategorized';
}

export async function saveUpload(file: any) {
  const dest = path.join(uploadDir, file.filename);
  return dest;
}

function runPythonOCR(filePath: string) {
  const tempJson = path.join(uploadDir, `${Date.now()}-${path.basename(filePath)}.ocr.json`);
  const result = spawnSync(
    pythonCmd,
    [pythonScript, filePath, tempJson],
    {
      encoding: 'utf-8',
      env: { ...process.env, OCR_LANGS: 'en' },
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Python OCR failed');
  }
  if (!fs.existsSync(tempJson)) {
    throw new Error('Python OCR output file missing');
  }

  const output = JSON.parse(fs.readFileSync(tempJson, 'utf-8'));
  fs.unlinkSync(tempJson);
  if (output.error) {
    throw new Error(output.error);
  }
  return output;
}

function normalizeLine(line: string) {
  return line
    .replace(/[\u00A0\u202F\u200B]/g, ' ')
    .replace(/[“”‘’]/g, "'")
    .replace(/[\u2013\u2014–—]/g, '-')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHeading(line: string) {
  return /^(menu|food menu|drinks menu|beverages|starters|main course|appetizers|desserts|salads|category|categories|menu items?)$/i.test(line.trim());
}

function normalizePriceToken(token: string) {
  if (!token) return null;
  const candidate = token
    .replace(/(₹|Rs\.?|INR|rs|r)/gi, '')
    .replace(/[^A-Za-z0-9.,]/g, '')
    .trim();

  if (!candidate) return null;
  const mapped = candidate.replace(/[A-Za-z]/g, (char) => PRICE_CHAR_MAP[char] ?? char);
  const normalized = mapped.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(normalized)) return null;
  return Number(normalized);
}

function parseLineWithTrailingPrice(line: string): ExtractedItem | null {
  const raw = normalizeLine(line);
  if (!raw || isHeading(raw)) return null;

  const match = raw.match(/^([\s\S]*?)\s*(?:[-:]+\s*)?(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*$/i);
  if (!match) return null;

  const name = normalizeMenuName(match[1] || '').trim();
  const price = Number(match[2]);
  if (!name || isHeading(name) || /^[\d\W]+$/.test(name)) return null;

  return {
    name,
    price,
    category: detectCategory(name),
    raw: line,
    confidence: 0,
  };
}

function extractMenuItemFromLine(line: string, confidence: number): ExtractedItem | null {
  const raw = normalizeLine(line);
  if (!raw || isHeading(raw)) return null;

  const match = raw.match(/^([\s\S]*?)\s*(?:[-:]+\s*)?(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*$/i);
  if (match) {
    const name = normalizeMenuName(match[1] || '').trim();
    const price = normalizePriceToken(match[2]);
    if (price !== null && name && !isHeading(name) && !/^[\d\W]+$/.test(name)) {
      return {
        name,
        price,
        category: detectCategory(name),
        raw: line,
        confidence: Number(confidence ?? 0),
      };
    }
  }

  const trimmed = raw.replace(/^([\-–—\s]+)+/, '').trim();
  const lineWithoutCurrency = trimmed.replace(/(₹|Rs\.?|INR|rs|r)/gi, '').trim();
  const segments = lineWithoutCurrency.split(/[-:|]+/).map((segment) => segment.trim()).filter(Boolean);
  let price: number | null = null;
  let namePart = '';

  if (segments.length > 1) {
    const lastSegment = segments[segments.length - 1] || '';
    price = normalizePriceToken(lastSegment);
    if (price !== null) {
      namePart = segments.slice(0, -1).join(' ');
    }
  }

  if (price === null) {
    const tokens = lineWithoutCurrency.split(/\s+/).filter(Boolean);
    const lastToken = tokens[tokens.length - 1] || '';
    price = normalizePriceToken(lastToken);
    if (price !== null) {
      namePart = tokens.slice(0, -1).join(' ');
    }
  }

  const nameCandidate = normalizeMenuName(namePart || lineWithoutCurrency).replace(/\s+[\dOQIlSZsB]+$/, '').trim();
  if (!nameCandidate || isHeading(nameCandidate) || /^[\d\W]+$/.test(nameCandidate)) return null;

  return {
    name: nameCandidate,
    price,
    category: detectCategory(nameCandidate),
    raw: line,
    confidence: Number(confidence ?? 0),
  };
}

function refinePriceToken(raw: string): string {
  const corrected = raw
    .replace(/[^A-Za-z0-9.,]/g, '')
    .split('')
    .map((ch) => PRICE_CHAR_MAP[ch] ?? ch)
    .join('');

  if (/^[0-9.]+$/.test(corrected) && corrected.length >= 3) {
    const digits = corrected.replace(/\./g, '');
    if (digits.length > 2 && digits.startsWith('8')) {
      const candidate = digits.slice(1);
      if (/^[0-9]{2,3}$/.test(candidate)) {
        return candidate;
      }
    }
    if (digits.length > 3) {
      const candidate = digits.slice(-3);
      if (/^[0-9]{2,3}$/.test(candidate)) {
        return candidate;
      }
    }
  }

  return corrected;
}

function normalizeMenuName(raw: string) {
  let cleaned = raw
    .replace(/(₹|Rs\.?|INR|rs|r)/gi, '')
    .replace(/[-:|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  cleaned = cleaned
    .split('')
    .map((char) => NAME_CHAR_MAP[char] ?? char)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, replacement] of SPECIAL_NAME_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  return fuzzyCorrectMenuName(cleaned)
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function fuzzyCorrectMenuName(name: string) {
  const knownWords = [
    'MOJITO', 'MILKSHAKE', 'BURGER', 'PIZZA', 'BIRYANI', 'FRIED', 'RICE', 'CHICKEN', 'COFFEE', 'TEA', 'DOSA', 'PASTA', 'SALAD', 'ICE', 'CREAM', 'SHAKE', 'SAMOSA', 'SPAGHETTI', 'CURRY', 'NAAN', 'DAL', 'VEG', 'VEGETABLE', 'MUTTON', 'FISH', 'SEAFOOD', 'SANDWICH', 'WRAP', 'HOT', 'DOG', 'NOODLE', 'NOODLES', 'CAKE', 'BUN', 'ROLL', 'SOUP', 'NACHO', 'MASALA', 'LEMONADE', 'COCKTAIL', 'MOCKTAIL', 'LATTE', 'ESPRESSO', 'CAPPUCCINO', 'SMOOTHIE', 'SAUSAGE', 'FRIES', 'NUGGET', 'KEBAB', 'RISOTTO', 'PUDDING', 'BROWNIE', 'SUNDAE', 'TART', 'PIE', 'GRILL', 'CURD'
  ];

  const corrected = name
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (knownWords.includes(upper)) return upper;
      let bestMatch = upper;
      let bestDist = Infinity;
      for (const candidate of knownWords) {
        const dist = levenshtein(upper, candidate);
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = candidate;
        }
      }
      if (bestDist <= Math.max(1, Math.floor(upper.length * 0.4))) {
        return titleCase(bestMatch);
      }
      return titleCase(word);
    })
    .join(' ');

  return titleCase(corrected);
}

function levenshtein(a: string, b: string) {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);
  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
      );
    }
  }
  return matrix[b.length][a.length];
}

export async function checkOCRHealth() {
  const result = spawnSync(
    pythonCmd,
    [pythonScript, '--health'],
    {
      encoding: 'utf-8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      maxBuffer: 5 * 1024 * 1024,
    }
  );

  if (result.error) {
    return {
      easyocr: false,
      tesseract: false,
      torch: false,
      easyocrVersion: "Unknown",
      tesseractVersion: "Unknown",
      torchVersion: "Unknown",
      pythonVersion: "Unknown",
      error: `Python command invocation failed: ${result.error.message}`
    };
  }

  if (result.status !== 0) {
    return {
      easyocr: false,
      tesseract: false,
      torch: false,
      easyocrVersion: "Unknown",
      tesseractVersion: "Unknown",
      torchVersion: "Unknown",
      pythonVersion: "Unknown",
      error: `Python health check failed: ${result.stderr || result.stdout}`
    };
  }

  try {
    return JSON.parse(result.stdout.trim());
  } catch (err: any) {
    return {
      easyocr: false,
      tesseract: false,
      torch: false,
      easyocrVersion: "Unknown",
      tesseractVersion: "Unknown",
      torchVersion: "Unknown",
      pythonVersion: "Unknown",
      error: `Failed to parse health check response: ${err.message}. Raw: ${result.stdout}`
    };
  }
}

export async function parseImageFile(filePath: string): Promise<OCRParseResult> {
  try {
    const output: any = runPythonOCR(filePath);
    const lines = Array.isArray(output.lines)
      ? output.lines.map((line: any) => ({ text: String(line.text || ''), confidence: Number(line.confidence ?? 0) }))
      : [];
    const result = parseText(lines.length ? lines : (output.text || ''));
    
    const fileId = path.basename(filePath);
    const fileIdNoExt = fileId.replace(/\.[^/.]+$/, "");
    
    result.confidence = typeof output.confidence === 'number' ? output.confidence : 0;
    result.engine = output.engine || 'Unknown';
    result.imageVersion = output.version || 'unknown';
    result.debugImages = {
      original: `/api/uploads/debug/${fileIdNoExt}/original.jpg`,
      processed_a: `/api/uploads/debug/${fileIdNoExt}/processed_a.jpg`,
      processed_b: `/api/uploads/debug/${fileIdNoExt}/processed_b.jpg`,
      processed_c: `/api/uploads/debug/${fileIdNoExt}/processed_c.jpg`
    };

    // Populate comparison fields
    result.easyocrText = output.easyocrText || '';
    result.easyocrConfidence = typeof output.easyocrConfidence === 'number' ? output.easyocrConfidence : 0;
    result.easyocrError = output.easyocrError || null;
    result.tesseractText = output.tesseractText || '';
    result.tesseractConfidence = typeof output.tesseractConfidence === 'number' ? output.tesseractConfidence : 0;

    console.log('--- Multi Engine Comparison Logs ---');
    console.log('Selected Engine:', result.engine);
    console.log('Selected Confidence:', result.confidence);
    console.log('Selected Image Version:', result.imageVersion);
    console.log('EasyOCR Text:\n', result.easyocrText);
    console.log('EasyOCR Confidence:', result.easyocrConfidence);
    console.log('EasyOCR Error:', result.easyocrError);
    console.log('Tesseract Text:\n', result.tesseractText);
    console.log('Tesseract Confidence:', result.tesseractConfidence);
    console.log('-----------------------------------');

    return result;
  } catch (error: any) {
    console.error('Python OCR failed, falling back to Tesseract:', error?.message || error);
    const buffer = fs.readFileSync(filePath);
    let resultText = '';
    let confidence = 0;
    try {
      const tRes = await Tesseract.recognize(buffer, 'eng', { logger: () => {} });
      resultText = tRes?.data?.text || '';
      confidence = (tRes?.data?.confidence || 0) / 100;
    } catch (err) {
      // ignore
    }
    const result = parseText(resultText);
    result.confidence = confidence;
    result.engine = 'Tesseract (Fallback)';
    result.imageVersion = 'original';

    // Populate comparison fields for failure
    result.easyocrError = `Python script failed: ${error?.message || error}`;
    result.easyocrText = '';
    result.easyocrConfidence = 0;
    result.tesseractText = resultText;
    result.tesseractConfidence = confidence;
    
    const fileId = path.basename(filePath);
    const fileIdNoExt = fileId.replace(/\.[^/.]+$/, "");
    const debugDir = path.join(uploadDir, 'debug', fileIdNoExt);
    try {
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
        fs.copyFileSync(filePath, path.join(debugDir, 'original.jpg'));
        fs.copyFileSync(filePath, path.join(debugDir, 'processed_a.jpg'));
        fs.copyFileSync(filePath, path.join(debugDir, 'processed_b.jpg'));
        fs.copyFileSync(filePath, path.join(debugDir, 'processed_c.jpg'));
      }
    } catch (err) {
      console.error('Failed to create fallback debug images:', err);
    }
    
    result.debugImages = {
      original: `/api/uploads/debug/${fileIdNoExt}/original.jpg`,
      processed_a: `/api/uploads/debug/${fileIdNoExt}/processed_a.jpg`,
      processed_b: `/api/uploads/debug/${fileIdNoExt}/processed_b.jpg`,
      processed_c: `/api/uploads/debug/${fileIdNoExt}/processed_c.jpg`
    };
    return result;
  }
}

type OCRLine = { text: string; confidence?: number };

function cleanItemName(name: string): string {
  let cleaned = name.trim();
  while (true) {
    const prev = cleaned;
    cleaned = cleaned.replace(/[\s\-\:\.\,₹\/\\_]+$/g, '').trim();
    cleaned = cleaned.replace(/\b(?:Rs\.?|INR|rs|r)$/gi, '').trim();
    if (cleaned === prev) {
      break;
    }
  }
  return cleaned;
}

export function parseText(rawText: string | OCRLine[]): OCRParseResult {
  const lines: OCRLine[] = Array.isArray(rawText)
    ? rawText
    : String(rawText)
        .split(/\r?\n/)
        .map((line) => ({ text: line, confidence: 0 }))
        .filter((line) => line.text.trim());

  const rawTextStr = Array.isArray(rawText)
    ? rawText.map(line => line.text).join('\n')
    : String(rawText);

  console.log('--- OCR RAW TEXT RECEIVED ---');
  console.log(rawTextStr);
  console.log('-----------------------------');

  const items: ExtractedItem[] = [];

  for (const line of lines) {
    const rawLine = line.text.trim();
    if (!rawLine) continue;

    // Try to match the final numeric token on the line
    const lastNumberMatch = rawLine.match(/(\d+(?:\.\d+)?)\s*[^0-9]*$/);

    if (!lastNumberMatch) {
      console.log(`Rejected:\n${rawLine}\n\nReason:\nNo price\n`);
      continue;
    }

    const priceVal = Number(lastNumberMatch[1]);
    const namePart = rawLine.substring(0, lastNumberMatch.index);
    const nameVal = cleanItemName(namePart);

    if (!nameVal) {
      console.log(`Rejected:\n${rawLine}\n\nReason:\nNo name\n`);
      continue;
    }

    // Fuzzy correct name
    const correctedName = fuzzyCorrectMenuName(nameVal);

    console.log(`Detected:\n${correctedName} = ${priceVal}\n`);

    items.push({
      name: correctedName,
      price: priceVal,
      category: detectCategory(correctedName),
      raw: rawLine,
      confidence: Number(line.confidence ?? 0),
    });
  }

  const errors: string[] = [];
  if (items.length === 0) {
    errors.push('No menu items detected');
  }

  return {
    items,
    errors,
    rawText: rawTextStr
  };
}

export async function parsePDFFile(filePath: string): Promise<OCRParseResult> {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const pdfPackage: any = require('pdf-parse');
    const pdfParser = pdfPackage.default || pdfPackage;
    if (typeof pdfParser === 'function') {
      const res = await pdfParser(dataBuffer);
      if (res && res.text && res.text.trim().length > 0) {
        const result = parseText(res.text);
        result.confidence = 1.0;
        result.engine = 'PDF Text Extractor';
        result.imageVersion = 'pdf';
        return result;
      }
    }
  } catch (err) {
    // ignore parsing failures
  }
  return { items: [], errors: ['PDF appears to be scanned images. Please upload as images (JPEG/PNG) or use a PDF-to-image tool before importing.'] };
}
