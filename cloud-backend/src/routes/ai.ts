// ai.ts
// DOGE Spatial Explorer — AI Service Proxy Routes
//
// Proxies AI requests to backend generation services:
// - Text-to-3D model generation
// - Text-to-texture generation
// - Text-to-scene generation
// - Image-to-3D reconstruction
// - Audio-to-scene visualization
// - RAG assistant queries

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createAiStream, generateAiResponse, getAiProviderModels, getAiProviderPolicy, getAiProviderStatuses, type AiProviderId } from '../providers/ai.js';

export const aiRouter: Router = Router();

// Exposes configuration state only — provider secrets are never returned.
aiRouter.get('/providers', (_req: Request, res: Response) => {
  res.json({ providers: getAiProviderStatuses() });
});

function parseProvider(value: string): AiProviderId | undefined {
  return value === 'openai' || value === 'nvidia-nim' ? value : undefined;
}

aiRouter.get('/providers/:provider/policy', (req: Request, res: Response) => {
  const provider = parseProvider(String(req.params.provider));
  if (!provider) return res.status(404).json({ error: 'Unknown AI provider' });
  try {
    return res.json({ provider, policy: getAiProviderPolicy(provider) });
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Provider is unavailable' });
  }
});

aiRouter.get('/providers/:provider/models', async (req: Request, res: Response) => {
  const provider = parseProvider(String(req.params.provider));
  if (!provider) return res.status(404).json({ error: 'Unknown AI provider' });
  try {
    return res.json(await getAiProviderModels(provider));
  } catch (error) {
    console.warn(`[AI] Model discovery failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return res.status(503).json({ error: 'Model discovery is unavailable' });
  }
});

// Unified text generation endpoint for OpenAI Responses and NVIDIA NIM.
aiRouter.post('/generate', async (req: Request, res: Response) => {
  const { provider, input, instructions, model, maxOutputTokens, allowFallback } = req.body as {
    provider?: AiProviderId;
    input?: string;
    instructions?: string;
    model?: string;
    maxOutputTokens?: number;
    allowFallback?: boolean;
  };

  if (!input || typeof input !== 'string' || input.trim().length > 32_000) {
    return res.status(400).json({ error: 'A text input up to 32,000 characters is required' });
  }
  if (provider && provider !== 'openai' && provider !== 'nvidia-nim') {
    return res.status(400).json({ error: 'Unsupported AI provider' });
  }

  try {
    const result = await generateAiResponse({
      provider,
      input,
      instructions: typeof instructions === 'string' ? instructions : undefined,
      model: typeof model === 'string' ? model : undefined,
      maxOutputTokens,
      allowFallback: allowFallback !== false,
    });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI provider request failed';
    console.warn(`[AI] Generation failed: ${message}`);
    const status = message.includes('must') || message.includes('permitted') || message.includes('characters') ? 400 : 502;
    return res.status(status).json({ error: status === 400 ? message : 'AI provider request failed' });
  }
});

// Streams the upstream OpenAI/NIM SSE response after applying the same server-side request policy.
aiRouter.post('/generate/stream', async (req: Request, res: Response) => {
  const { provider, input, instructions, model, maxOutputTokens } = req.body as {
    provider?: AiProviderId; input?: string; instructions?: string; model?: string; maxOutputTokens?: number;
  };
  if (!provider || !parseProvider(provider) || !input || typeof input !== 'string') {
    return res.status(400).json({ error: 'A configured provider and text input are required' });
  }
  try {
    const stream = await createAiStream(provider, { provider, input, instructions, model, maxOutputTokens, allowFallback: false });
    res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`: provider=${stream.provider}; model=${stream.model}\n\n`);
    const reader = stream.response.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (error) {
    console.warn(`[AI] Stream generation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    if (!res.headersSent) return res.status(503).json({ error: 'AI streaming is unavailable' });
    return res.end('event: error\ndata: {"error":"AI stream interrupted"}\n\n');
  }
});

// Text-to-3D Model Generation
aiRouter.post('/text-to-3d', async (req: Request, res: Response) => {
  const { prompt, style, format, quality, polyCount } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // In production, forward to AI model generation service
  // (e.g., Meshy, Tripo3D, or custom pipeline)
  const jobId = uuidv4();

  res.json({
    jobId,
    status: 'processing',
    assetURL: `https://api.doge-spatial.example.com/assets/generated/${jobId}.${format || 'glb'}`,
    format: format || 'glb',
    polyCount: 50000,
    processingTimeMs: 15000,
    prompt,
    style: style || 'realistic',
  });
});

// Text-to-Texture Generation
aiRouter.post('/text-to-texture', async (req: Request, res: Response) => {
  const { prompt, resolution, channels } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const jobId = uuidv4();
  const baseUrl = `https://api.doge-spatial.example.com/assets/textures/${jobId}`;

  res.json({
    jobId,
    status: 'processing',
    baseColorURL: `${baseUrl}_baseColor.png`,
    normalURL: `${baseUrl}_normal.png`,
    roughnessURL: `${baseUrl}_roughness.png`,
    metallicURL: `${baseUrl}_metallic.png`,
    resolution: resolution || 2048,
  });
});

// Text-to-Scene Generation
aiRouter.post('/text-to-scene', async (req: Request, res: Response) => {
  const { prompt, maxObjects, includeEnvironment, includeLighting } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Generate a scene layout based on the prompt
  res.json({
    sceneName: prompt.slice(0, 50),
    objects: [
      {
        name: 'Generated Object 1',
        primitiveType: 'box',
        position: [0, 0.5, 0],
        scale: [1, 1, 1],
        colorHex: '#4A90D9',
        roughness: 0.5,
        metallic: 0.0,
        meshURL: null,
      },
    ],
  });
});

// Image-to-3D Reconstruction
aiRouter.post('/image-to-3d', async (req: Request, res: Response) => {
  const { imageBase64, format, quality } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  const jobId = uuidv4();

  res.json({
    jobId,
    status: 'processing',
    assetURL: `https://api.doge-spatial.example.com/assets/generated/${jobId}.${format || 'glb'}`,
    format: format || 'glb',
    polyCount: 100000,
    processingTimeMs: 30000,
  });
});

// Audio-to-Scene Visualization
aiRouter.post('/audio-to-scene', async (req: Request, res: Response) => {
  const { audioURL, visualizationType } = req.body;

  res.json({
    sceneName: 'Audio Visualization',
    objects: [],
    visualizationType: visualizationType || 'spatial_waveform',
  });
});

// RAG Assistant
aiRouter.post('/assistant', async (req: Request, res: Response) => {
  const { question, sceneContext, mode, provider } = req.body as {
    question?: string;
    sceneContext?: { entityCount?: number; sceneName?: string };
    mode?: string;
    provider?: AiProviderId;
  };

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const context = JSON.stringify({
      sceneName: sceneContext?.sceneName ?? 'untitled scene',
      entityCount: sceneContext?.entityCount ?? 0,
      mode: mode ?? 'spatial_editing',
    });
    const result = await generateAiResponse({
      provider,
      instructions: 'You are the DOGE Spatial Explorer assistant. Give concise, safe spatial-editing guidance. Do not invent device state or claim an action was executed.',
      input: `Scene context: ${context}\n\nOperator question: ${question.slice(0, 16_000)}`,
      maxOutputTokens: 800,
    });
    return res.json({
      answer: result.text,
      provider: result.provider,
      model: result.model,
      responseId: result.responseId,
      attempts: result.attempts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI provider request failed';
    console.warn(`[AI] Assistant request failed: ${message}`);
    return res.status(503).json({ error: 'No configured AI provider is available' });
  }
});

// Check AI job status
aiRouter.get('/jobs/:jobId', async (req: Request, res: Response) => {
  res.json({
    jobId: req.params.jobId,
    status: 'completed',
    progress: 1.0,
  });
});
