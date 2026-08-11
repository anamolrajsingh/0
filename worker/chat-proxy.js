/**
 * Chat Proxy — Cloudflare Worker
 *
 * Proxies chat requests from anamolrajsingh.com.np to AI providers.
 * The API key is stored as an encrypted Cloudflare Worker secret
 * (GEMINI_API_KEY) — never shipped to the browser.
 *
 * Deploy:
 *   1. wrangler secret put GEMINI_API_KEY   (paste your Gemini API key)
 *   2. wrangler deploy
 *   3. Update CHAT_PROXY_URL in script.js to the worker URL
 *
 * Rate limit: 10 messages per hour per visitor (by IP).
 * CORS: only https://anamolrajsingh.com.np
 */

const ORIGIN = 'https://anamolrajsingh.com.np';
const RATE_LIMIT = 10;
const RATE_WINDOW = 3600;

const GEMINI_MODELS = {
  'gemini-flash-latest': 'gemini-flash-latest',
  'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
  // 'gemini-2.5-pro': 'gemini-2.5-pro',
};

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

// ── Provider: Gemini ───────────────────────────────────────────
async function callGemini(env, model, messages) {
  const modelName = GEMINI_MODELS[model] || GEMINI_MODELS['gemini-2.5-flash'];
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Run: wrangler secret put GEMINI_API_KEY');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

// ── Provider: OpenAI (DISABLED) ────────────────────────────────
// Disabled: no free tier as of 2026, requires billing enabled.
// Uncomment and add OPENAI_API_KEY as a secret to enable.
//
// async function callOpenAI(env, model, messages) {
//   const apiKey = env.OPENAI_API_KEY;
//   if (!apiKey) throw new Error('OPENAI_API_KEY is not set. Run: wrangler secret put OPENAI_API_KEY');
//   const resp = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
//     body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: messages.map(m => ({ role: m.role, content: m.content })) }),
//   });
//   if (!resp.ok) { const err = await resp.text(); throw new Error(`OpenAI API error (${resp.status}): ${err}`); }
//   const data = await resp.json();
//   const text = data?.choices?.[0]?.message?.content;
//   if (!text) throw new Error('OpenAI returned an empty response.');
//   return text;
// }

// ── Provider: Anthropic (DISABLED) ──────────────────────────────
// Disabled: no free tier as of 2026, requires billing enabled.
// Uncomment and add ANTHROPIC_API_KEY as a secret to enable.
//
// async function callAnthropic(env, model, messages) {
//   const apiKey = env.ANTHROPIC_API_KEY;
//   if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set. Run: wrangler secret put ANTHROPIC_API_KEY');
//   const resp = await fetch('https://api.anthropic.com/v1/messages', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
//     body: JSON.stringify({ model: model || 'claude-3-5-haiku-latest', max_tokens: 1024, messages: messages.map(m => ({ role: m.role, content: m.content })) }),
//   });
//   if (!resp.ok) { const err = await resp.text(); throw new Error(`Anthropic API error (${resp.status}): ${err}`); }
//   const data = await resp.json();
//   const text = data?.content?.[0]?.text;
//   if (!text) throw new Error('Anthropic returned an empty response.');
//   return text;
// }

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed. Use POST.' }, 405);

    const reqOrigin = request.headers.get('Origin');
    if (reqOrigin !== ORIGIN) return json({ error: 'Origin not allowed.' }, 403);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return json({ error: 'Rate limit reached. You can send up to 10 messages per hour. Please try again later.', rateLimited: true }, 429);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }

    const provider = body.provider || 'gemini';
    const model = body.model || DEFAULT_MODEL;
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Messages array is required.' }, 400);
    }

    try {
      let reply;
      switch (provider) {
        case 'gemini':
          reply = await callGemini(env, model, messages);
          break;
        // Disabled: no free tier as of 2026, requires billing enabled.
        // Uncomment and add the API key as a secret to enable.
        // case 'openai':
        //   reply = await callOpenAI(env, model, messages);
        //   break;
        // case 'anthropic':
        //   reply = await callAnthropic(env, model, messages);
        //   break;
        default:
          return json({ error: `Unknown provider: ${provider}. Available: gemini` }, 400);
      }
      return json({ reply, provider, model, rateRemaining: rl.remaining });
    } catch (err) {
      return json({ error: err.message || 'An unexpected error occurred.', provider }, 502);
    }
  },
};
