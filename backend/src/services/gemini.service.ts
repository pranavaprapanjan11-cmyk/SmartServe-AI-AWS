import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export async function runStartupTest(): Promise<boolean> {
  console.log('Gemini Key Present:', !!process.env.GEMINI_API_KEY);
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ Gemini key missing');
    return false;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Reply with SMARTSERVE_GEMINI_OK',
    });
    
    const text = (response.text || '').trim();
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        maxOutputTokens: 800,
        systemInstruction,
      },
    });
    return response.text || '';
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        'Extract structured details from the provided restaurant menu or invoice/receipt image.',
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
      ],
      config: {
        systemInstruction:
          'You are an AI-powered restaurant document processing assistant. You must analyze the image and extract the restaurant name or supplier name (populate both restaurantName and supplierName with this value), invoiceNumber (if none, return empty string), invoiceDate (if none, return empty string), subtotal (sum of items), tax (VAT/GST if any, default 0), and grandTotal (subtotal + tax). For the items list, populate each item with name, description (short description or empty string), category (menu category, or General), price (rate/price), quantity (default 1), unitPrice (rate/price), and totalPrice (quantity * unitPrice). Return a valid JSON matching the schema exactly.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            restaurantName: { type: 'STRING' },
            supplierName: { type: 'STRING' },
            invoiceNumber: { type: 'STRING' },
            invoiceDate: { type: 'STRING' },
            subtotal: { type: 'NUMBER' },
            tax: { type: 'NUMBER' },
            grandTotal: { type: 'NUMBER' },
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  description: { type: 'STRING' },
                  category: { type: 'STRING' },
                  price: { type: 'NUMBER' },
                  quantity: { type: 'NUMBER' },
                  unitPrice: { type: 'NUMBER' },
                  totalPrice: { type: 'NUMBER' }
                },
                required: ['name', 'description', 'category', 'price', 'quantity', 'unitPrice', 'totalPrice'],
              },
            },
          },
          required: ['restaurantName', 'supplierName', 'invoiceNumber', 'invoiceDate', 'subtotal', 'tax', 'grandTotal', 'items'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty document parser response');
    }
    return JSON.parse(text) as ParsedDocumentResult;
  } catch (err: any) {
    console.error('Gemini document parsing failed:', err);
    throw err;
  }
}
