import { Request, Response } from 'express';
import { ai } from '../../services/gemini.service';

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

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: 'You are SmartServe AI, an elite, real-time operations manager companion for a smart restaurant ecosystem. You help managers interpret business analytics, understand live inventory levels, check kitchen queues, and calculate table turnarounds based on database layouts. Format your operational recommendations using clean, readable Markdown syntax.',
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }
    res.end();
  } catch (err: any) {
    console.error('Assistant chat failed:', err);
    // If headers have already been sent, end the response
    if (res.headersSent) {
      if (!res.writableEnded) res.end();
      return;
    }
    return res.status(500).json({ message: 'Assistant chat processing failed', error: String(err.message || err) });
  }
}
