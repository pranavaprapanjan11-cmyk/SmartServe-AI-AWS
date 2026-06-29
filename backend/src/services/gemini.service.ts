import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Lazy loader for GoogleGenerativeAI client
let genAIInstance: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAIInstance;
}

export function getModel(systemInstruction?: string) {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
  });
}

export async function runStartupTest(): Promise<boolean> {
  console.log('Gemini Key Present:', !!process.env.GEMINI_API_KEY);
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ Gemini key missing');
    return false;
  }

  try {
    const model = getModel();
    const response = await Promise.race([
      model.generateContent('Reply with SMARTSERVE_GEMINI_OK'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    const text = (response.response.text() || '').trim();
    console.log('Gemini Test Response:', text);
    if (text.includes('SMARTSERVE_GEMINI_OK')) {
      console.log('✅ Gemini configured and verified successfully!');
      return true;
    } else {
      console.log(`❌ Gemini returned unexpected response: "${text}"`);
      return false;
    }
  } catch (err: any) {
    console.error('❌ Gemini startup connection test failed:', err.message || err);
    return false;
  }
}

export async function generateChatResponse(
  contents: any[],
  systemInstruction: string
): Promise<string> {
  try {
    const model = getModel(systemInstruction);
    const result = await Promise.race([
      model.generateContent({ contents }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini request timeout (15s)')), 15000))
    ]);
    return result.response.text() || '';
  } catch (err: any) {
    console.error('Gemini chat generation failed:', err);
    throw err;
  }
}

export interface ParsedDocumentResult {
  restaurantName: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  tax: number;
  grandTotal: number;
  items: {
    name: string;
    description: string;
    category: string;
    price: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export async function parseDocumentImage(
  base64Data: string,
  mimeType: string
): Promise<ParsedDocumentResult> {
  try {
    const model = getGenAI().getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            restaurantName: { type: SchemaType.STRING },
            supplierName: { type: SchemaType.STRING },
            invoiceNumber: { type: SchemaType.STRING },
            invoiceDate: { type: SchemaType.STRING },
            subtotal: { type: SchemaType.NUMBER },
            tax: { type: SchemaType.NUMBER },
            grandTotal: { type: SchemaType.NUMBER },
            items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  category: { type: SchemaType.STRING },
                  price: { type: SchemaType.NUMBER },
                  quantity: { type: SchemaType.NUMBER },
                  unitPrice: { type: SchemaType.NUMBER },
                  totalPrice: { type: SchemaType.NUMBER }
                },
                required: ['name', 'description', 'category', 'price', 'quantity', 'unitPrice', 'totalPrice'],
              },
            },
          },
          required: ['restaurantName', 'supplierName', 'invoiceNumber', 'invoiceDate', 'subtotal', 'tax', 'grandTotal', 'items'],
        },
      }
    });

    const result = await Promise.race([
      model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Extract structured details from the provided restaurant menu or invoice/receipt image.' },
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
            ],
          }
        ]
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini OCR parsing request timeout (15s)')), 15000))
    ]);

    const text = result.response.text();
    if (!text) {
      throw new Error('Gemini returned an empty document parser response');
    }
    return JSON.parse(text) as ParsedDocumentResult;
  } catch (err: any) {
    console.error('Gemini document parsing failed:', err);
    throw err;
  }
}
