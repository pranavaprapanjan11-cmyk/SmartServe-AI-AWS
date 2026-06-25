import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { saveUpload, parseImageFile, parsePDFFile, parseText, checkOCRHealth } from './ocr.service';
import { OCRParseResult, ExtractedItem } from './ocr.types';
import * as menuService from '../menu/menu.service';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, uploadDir),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

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
router.post('/parse', upload.single('file'), async (req: any, res: Response) => {
  try {
    let filePath: string | null = null;
    if (req.file) {
      filePath = (req.file as Express.Multer.File).path;
    } else if (req.body.fileId) {
      const candidate = path.join(uploadDir, req.body.fileId);
      if (fs.existsSync(candidate)) filePath = candidate;
      else return res.status(400).json({ message: 'fileId not found' });
    } else {
      return res.status(400).json({ message: 'No file or fileId provided' });
    }

    const ext = path.extname(filePath!).toLowerCase();
    let result: OCRParseResult;
    if (ext === '.pdf') result = await parsePDFFile(filePath!);
    else result = await parseImageFile(filePath!);

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: 'OCR parse failed', error: String(err.message || err) });
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
