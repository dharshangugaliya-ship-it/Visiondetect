/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON with generous limit for base64 image data
app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Open-Vocabulary Object Detection Endpoint
app.post('/api/detect', async (req: Request, res: Response) => {
  const { image, target, threshold = 0.25 } = req.body;

  if (!image || !target) {
    return res.status(400).json({
      error: 'Missing required parameters: image and target are required.',
    });
  }

  const startTime = performance.now();

  if (!ai) {
    // When no API key is provided, return empty or client-fallback signal
    return res.status(200).json({
      success: false,
      fallbackRequired: true,
      message: 'GEMINI_API_KEY not configured on server. Falling back to local open-vocabulary matcher.',
      target,
      matchesFound: 0,
      detections: [],
      latencyMs: Math.round(performance.now() - startTime),
    });
  }

  try {
    // Extract mime type and base64 payload from data URL
    let mimeType = 'image/jpeg';
    let base64Data = image;

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const promptText = `Find and localize all instances of "${target}" in this image.
If there are no instances of "${target}", return an empty array.
If instances of "${target}" are present, provide:
1. label: The specific name/description of the detected item (e.g. "${target}").
2. confidence: Floating point confidence score between 0.0 and 1.0.
3. box_2d: 2D bounding box array [ymin, xmin, ymax, xmax] normalized on a 0 to 1000 integer scale.
4. description: A brief 3-6 word note about the location or state of the object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        systemInstruction:
          'You are an expert open-vocabulary computer vision object detector. Users can enter any object or concept they want to find, and you locate matching instances within the visual feed. Localize objects with precise 2D bounding boxes [ymin, xmin, ymax, xmax] on a 0-1000 scale. If the specified target does not exist in the image, return [].',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: {
                type: Type.STRING,
                description: 'The matched class or object name.',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Detection confidence between 0.0 and 1.0.',
              },
              box_2d: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: 'Bounding box [ymin, xmin, ymax, xmax] normalized from 0 to 1000.',
              },
              description: {
                type: Type.STRING,
                description: 'Brief visual description of the matched object.',
              },
            },
            required: ['label', 'confidence', 'box_2d'],
          },
        },
      },
    });

    const text = response.text || '[]';
    let rawItems: any[] = [];
    try {
      rawItems = JSON.parse(text);
      if (!Array.isArray(rawItems)) rawItems = [];
    } catch {
      rawItems = [];
    }

    const detections = rawItems
      .filter((item) => item.confidence >= threshold)
      .map((item, idx) => ({
        id: `open-voc-${idx}-${Date.now()}`,
        label: item.label || target,
        confidence: Number(item.confidence.toFixed(2)),
        box_2d: item.box_2d, // [ymin, xmin, ymax, xmax] in 0-1000
        description: item.description || '',
      }));

    const latencyMs = Math.max(20, Math.round(performance.now() - startTime));

    return res.json({
      success: true,
      target,
      matchesFound: detections.length,
      detections,
      latencyMs,
    });
  } catch (error: any) {
    console.error('Error during open-vocabulary detection:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to perform open-vocabulary detection.',
      target,
      matchesFound: 0,
      detections: [],
      latencyMs: Math.round(performance.now() - startTime),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
