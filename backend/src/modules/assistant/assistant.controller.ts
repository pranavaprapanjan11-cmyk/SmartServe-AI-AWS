import { Request, Response } from 'express';
import { getModel } from '../../services/gemini.service';

export async function handleAssistantChat(req: Request, res: Response) {
  try {
    const { messages } = req.body as { messages: { role: 'user' | 'model'; content: string }[] };
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY environment variable is not configured.' });
    }

    // Map history to shape expected by Gemini
    const contents = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    console.log("AI Request Received (Stream)");

    const systemInstruction = `You are SmartServe AI.
You help restaurant owners, managers, waiters, and kitchen staff.
You answer questions about:
- Orders
- Menu items
- Revenue
- Customer analytics
- Restaurant operations
- Inventory
- Staff productivity
Provide concise, actionable responses. Format your operational recommendations using clean, readable Markdown syntax.`;

    const model = getModel(systemInstruction);
    const responseStream = await model.generateContentStream({ contents });

    for await (const chunk of responseStream.stream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }
    console.log("Gemini Response Generated (Stream)");
    res.end();
  } catch (err: any) {
    console.error('Gemini Error:', err);
    // If headers have already been sent, end the response
    if (res.headersSent) {
      if (!res.writableEnded) res.end();
      return;
    }
    return res.status(500).json({ message: 'Assistant chat processing failed', error: String(err.message || err) });
  }
}
