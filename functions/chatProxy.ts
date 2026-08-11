/**
 * Chat Proxy — Base44 Backend Function
 *
 * Proxies chat requests from anamolrajsingh.com.np to OpenRouter API.
 * The OPENROUTER_API_KEY is stored as an environment secret — never shipped to the browser.
 *
 * Rate limit: 10 messages per hour per visitor (by IP via CF-Connecting-IP or X-Forwarded-For).
 * CORS: allows https://anamolrajsingh.com.np
 * Default model: openai/gpt-4o
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  model?: string;
  messages: ChatMessage[];
}

const ORIGIN = 'https://anamolrajsingh.com.np';
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MODEL = 'openai/gpt-4o';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = 'https://anamolrajsingh.com.np';
const SITE_NAME = 'Anamol Raj Singh';

const rateMap = new Map<string, { ts: number; count: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > RATE_WINDOW_MS) {
    rateMap.set(ip, { ts: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResp(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders() },
  });
}

async function callOpenRouter(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
  const resp = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenRouter API error (${resp.status}): ${err}`);
  }

  const data = await resp.json() as any;
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned an empty response.');
  return text;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResp({ error: 'Method not allowed. Use POST.' }, 405);
  }

  const reqOrigin = req.headers.get('Origin');
  if (reqOrigin !== ORIGIN) {
    return jsonResp({ error: 'Origin not allowed.' }, 403);
  }

  const ip = req.headers.get('CF-Connecting-IP') ||
             req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
             'unknown';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return jsonResp({
      error: 'Rate limit reached. You can send up to 10 messages per hour. Please try again later.',
      rateLimited: true,
    }, 429);
  }

  let body: ChatRequestBody;
  try {
    body = await req.json() as ChatRequestBody;
  } catch {
    return jsonResp({ error: 'Invalid JSON body.' }, 400);
  }

  const model = body.model || DEFAULT_MODEL;
  const messages = body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return jsonResp({ error: 'Messages array is required.' }, 400);
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set.');

    const reply = await callOpenRouter(apiKey, model, messages);

    return jsonResp({
      reply,
      model,
      rateRemaining: rl.remaining,
    });

  } catch (err) {
    return jsonResp({
      error: (err as Error).message || 'An unexpected error occurred.',
    }, 502);
  }
}
