import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { saveUpload, parseImageFile, parsePDFFile, parseText, checkOCRHealth } from './ocr.service';
import { OCRParseResult, ExtractedItem } from './ocr.types';
import * as menuService from '../menu/menu.service';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';
import { GoogleGenAI } from '@google/genai';
import { importOcrInvoice } from '../inventory/inventory.service';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, uploadDir),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function parseBase64Image(payload: string) {
  const matches = payload.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  return {
    mimeType: 'image/jpeg',
    data: payload
  };
}

// GET /api/ocr/health - check status of python torch, easyocr, and tesseract
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await checkOCRHealth();
    return res.json(health);
  } catch (err: any) {
    return res.status(500).json({ error: String(err.message || err) });
  }
});

// POST /api/ocr/upload - save file and return fileId (filename)
router.post('/upload', upload.single('file'), async (req: any, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });
  // basic validation
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ message: 'Unsupported file type' });
  }
  // return file id
  return res.json({ fileId: file.filename, originalName: file.originalname });
});

// POST /api/ocr/parse - parse previously uploaded file by fileId or accept file directly
router.post('/parse', authenticateJWT, upload.single('file'), async (req: any, res: Response) => {
  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (req.body.image) {
      // Inline base64 payload
      const parsed = parseBase64Image(req.body.image);
      base64Data = parsed.data;
      mimeType = parsed.mimeType;
    } else {
      let filePath: string | null = null;
      if (req.file) {
        filePath = (req.file as Express.Multer.File).path;
      } else if (req.body.fileId) {
        const candidate = path.join(uploadDir, req.body.fileId);
        if (fs.existsSync(candidate)) filePath = candidate;
        else return res.status(400).json({ message: 'fileId not found' });
      } else {
        return res.status(400).json({ message: 'No file, fileId or image base64 provided' });
      }

      const ext = path.extname(filePath!).toLowerCase();
      mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.pdf' ? 'application/pdf' : 'image/jpeg';
      base64Data = fs.readFileSync(filePath).toString('base64');
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY environment variable is not configured.' });
    }

    let attempts = 0;
    let parsedResult: any = null;
    let geminiError: any = null;

    const { parseDocumentImage } = require('../../services/gemini.service');

    while (attempts < 2) {
      try {
        parsedResult = await parseDocumentImage(base64Data, mimeType);
        break;
      } catch (err) {
        geminiError = err;
        attempts++;
        console.warn(`Gemini OCR parse attempt ${attempts} failed:`, err);
      }
    }

    if (!parsedResult) {
      return res.status(500).json({
        message: 'Gemini OCR parse and validation failed after retries',
        error: String(geminiError?.message || geminiError)
      });
    }

    // Confidence validation logic
    let confidence = 0.95;
    const computedTotal = (parsedResult.items || []).reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unitPrice || item.price)), 0);
    const subtotal = Number(parsedResult.subtotal || 0);
    const tax = Number(parsedResult.tax || 0);
    const grandTotal = Number(parsedResult.grandTotal || 0);
    
    let confidenceIssues: string[] = [];

    if (Math.abs((subtotal + tax) - grandTotal) > 2) {
      confidence -= 0.15;
      confidenceIssues.push("Sum of subtotal and tax does not equal grand total.");
    }
    if (Math.abs(computedTotal - subtotal) > 5 && Math.abs(computedTotal - grandTotal) > 5) {
      confidence -= 0.15;
      confidenceIssues.push("Sum of item prices does not match subtotal.");
    }

    parsedResult.confidence = Math.max(0.1, confidence);
    parsedResult.confidenceIssues = confidenceIssues;

    return res.json({
      success: true,
      data: parsedResult
    });
  } catch (err: any) {
    console.error('Gemini OCR receipt parse failed:', err);
    return res.status(500).json({ message: 'Gemini OCR parse failed', error: String(err.message || err) });
  }
});

// POST /api/ocr/confirm-invoice - commit reviewed invoice to inventory
router.post('/confirm-invoice', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Unauthorized: User context is required to register inventory imports.' });
    }

    const payload = req.body;
    const purchaseOrder = await importOcrInvoice(userId, role, payload);

    return res.json({
      success: true,
      purchaseOrder
    });
  } catch (err: any) {
    console.error('OCR Invoice confirmation failed:', err);
    return res.status(500).json({ message: 'Invoice import failed', error: String(err.message || err) });
  }
});

// POST /api/ocr/import - accept extracted items and create menu items (no duplicates)
router.post(
  '/import',
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN),
  async (req: Request, res: Response) => {
  try {
    const items: ExtractedItem[] = req.body.items;
    const restaurantId = (req as any).user?.id || req.body.restaurantId;
    if (!restaurantId) return res.status(400).json({ message: 'restaurantId required or authenticate' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items provided' });

    const created: any[] = [];
    for (const it of items) {
      const name = (it.name || '').trim();
      const category = (it.category || 'Uncategorized').trim();
      const price = typeof it.price === 'number' ? it.price : Number(it.price) || 0;
      if (!name) continue;

      const categories = await menuService.getCategories(restaurantId);
      let categoryId = categories.find(c => c.name === category)?.id;
      if (!categoryId) {
        const createdCategory = await menuService.createMenuCategory(restaurantId, { name: category, description: '' });
        categoryId = createdCategory.id;
      }

      const existingItems = await menuService.searchMenuItems(restaurantId, name, categoryId);
      if (existingItems.length > 0) continue;

      const itemPayload = {
        category_id: categoryId,
        name,
        description: '',
        price,
        is_available: true,
        is_bestseller: false,
      };

      const createdItem = await menuService.createMenuItem(restaurantId, itemPayload);
      created.push({ id: createdItem.id, name, category, price });
    }

    return res.json({ created });
  } catch (err: any) {
    return res.status(500).json({ message: 'Import failed', error: String(err.message || err) });
  }
});

export default router;
