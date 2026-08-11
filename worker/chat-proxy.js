/**
 * Chat Proxy — Cloudflare Worker
 *
 * Proxies chat requests from anamolrajsingh.com.np to OpenRouter.
 * The API key is stored as an encrypted Cloudflare Worker secret
 * (OPENROUTER_API_KEY) — never shipped to the browser.
 *
 * Deploy:
 *   1. wrangler secret put OPENROUTER_API_KEY   (paste your OpenRouter API key)
 *   2. wrangler deploy
 *
 * Rate limit: 10 messages per hour per visitor (by IP).
 * CORS: only https://anamolrajsingh.com.np
 */

const ORIGIN = 'https://anamolrajsingh.com.np';
const RATE_LIMIT = 10;
const RATE_WINDOW = 3600;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = 'https://anamolrajsingh.com.np';
const SITE_NAME = 'Anamol Raj Singh';

const rateMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > RATE_WINDOW * 1000) {
    rateMap.set(ip, { ts: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function callOpenRouter(env, model, messages) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set. Run: wrangler secret put OPENROUTER_API_KEY');

  const resp = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-4o',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenRouter API error (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned an empty response.');
  return text;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed. Use POST.' }, 405);
    }

    const reqOrigin = request.headers.get('Origin');
    if (reqOrigin !== ORIGIN) {
      return json({ error: 'Origin not allowed.' }, 403);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return json({
        error: 'Rate limit reached. You can send up to 10 messages per hour. Please try again later.',
        rateLimited: true,
      }, 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const model = body.model || 'openai/gpt-4o';
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Messages array is required.' }, 400);
    }

    try {
      const reply = await callOpenRouter(env, model, messages);

      return json({
        reply,
        model,
        rateRemaining: rl.remaining,
      });

    } catch (err) {
      return json({
        error: err.message || 'An unexpected error occurred.',
      }, 502);
    }
  },
};
