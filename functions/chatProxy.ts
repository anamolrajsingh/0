/**
 * Chat Proxy — Base44 Backend Function
 *
 * Proxies chat requests from anamolrajsingh.com.np to Gemini API.
 * The GEMINI_API_KEY is stored as an environment secret — never shipped to the browser.
 *
 * Rate limit: 10 messages per hour per visitor (by IP via CF-Connecting-IP or X-Forwarded-For).
 * CORS: allows https://anamolrajsingh.com.np
 * Default model: gemini-flash-latest (Gemini 2.5 Flash, most generous free-tier quota)
 */

// ---- Types ----
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  provider?: string;
  model?: string;
  messages: ChatMessage[];
}

// ---- Config ----
const ORIGIN = 'https://anamolrajsingh.com.np';
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MODEL = 'gemini-flash-latest';

// Gemini models that can be used (flash = most generous free tier)
const GEMINI_MODELS: Record<string, string> = {
  'gemini-flash-latest': 'gemini-flash-latest',
  'gemini-flash-lite-latest': 'gemini-flash-lite-latest',
  'gemini-pro-latest': 'gemini-pro-latest',
  // 'gemini-2.5-flash': deprecated for new users — do NOT use as default
};

// ── System prompt (server-side, not tamperable from browser) ───
const SYSTEM_PROMPT = `You are the AI assistant featured on Anamol Raj Singh's personal site — a multi-purpose assistant built to think and converse broadly, not a narrow FAQ bot. You can discuss technology, current events, philosophy, design, books, film, and general knowledge, while reflecting Anamol's own curiosity and areas of interest.

SCOPE
- You are a general-purpose knowledge assistant. Engage with any reasonable topic the visitor brings up — technical, current affairs, philosophical, creative, or casual.
- Draw naturally on these areas of interest when relevant or when a visitor asks what you/Anamol are into:
  - Technology: how things work under the hood, from web development to systems thinking, and staying current on what's new in the field
  - Reading & Ideas: books, essays, and long-form writing that challenge perspective
  - Current Affairs: geopolitics, economics, and the forces shaping the world
  - Design: where aesthetics meets function, and how design shapes experience
  - Philosophy: questioning assumptions and exploring open-ended questions
  - Film & Media: cinema, documentaries, and how storytelling shapes culture
- You can still answer questions about Anamol specifically (projects, skills, background) — treat that as one topic among many, not the only one.
- For anything you're unsure about or that may have changed recently (news, releases, current events), say so honestly rather than guessing.
- Decline only genuinely inappropriate topics (explicit content, harmful instructions, etc.) — redirect politely rather than lecturing.

TONE & DEPTH
- Be conversational and clear, like a well-read, curious person talking with a friend — not a textbook or a search engine dump.
- Default to concise answers (a few sentences to a short paragraph). Go deeper only when the visitor asks for more detail or nuance.
- Where a topic has more than one reasonable perspective (current affairs, philosophy, design opinions), present the range fairly rather than pushing one view as fact.

FORMATTING
- Never use Markdown symbols in your output — no ** for bold, no ## for headers, no numbered lists with periods, no dashes for bullets.
- Write every answer as plain prose sentences, even when listing multiple items (e.g. "Vg can mean a few things: video games in gaming slang, 'very good' in texting, vegetable glycerin in e-liquids, or Verdens Gang, a Norwegian newspaper.").
- If you are about to output a symbol like * or #, replace it with plain words instead.

PERSONA
- Speak as a capable, thoughtful assistant — curious and well-informed, with a personality shaped by Anamol's own interests, but able to hold a real conversation on essentially anything a visitor brings up.`

const GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 200,
  topP: 0.9,
};

// ---- Rate limiting (in-memory per instance) ----
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

// ---- CORS headers ----
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

// ---- Provider: Gemini ----
async function callGemini(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
  const modelName = GEMINI_MODELS[model] || DEFAULT_MODEL;

  // Strip client-side system messages — server prompt is authoritative
  const filtered = messages.filter(m => m.role !== 'system');

  // Convert to Gemini "contents" format
  const contents = filtered.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: GENERATION_CONFIG,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${err}`);
  }

  const data = await resp.json() as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

// ---- Provider: OpenAI (DISABLED) ----
// Disabled: no free tier as of 2026, requires billing enabled.
// Uncomment and add OPENAI_API_KEY as a secret to enable.
//
// async function callOpenAI(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
//   const resp = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: model || 'gpt-4o-mini',
//       messages: messages.map(m => ({ role: m.role, content: m.content })),
//     }),
//   });
//   if (!resp.ok) { const err = await resp.text(); throw new Error(`OpenAI API error (${resp.status}): ${err}`); }
//   const data = await resp.json() as any;
//   const text = data?.choices?.[0]?.message?.content;
//   if (!text) throw new Error('OpenAI returned an empty response.');
//   return text;
// }

// ---- Provider: Anthropic (DISABLED) ----
// Disabled: no free tier as of 2026, requires billing enabled.
// Uncomment and add ANTHROPIC_API_KEY as a secret to enable.
//
// async function callAnthropic(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
//   const resp = await fetch('https://api.anthropic.com/v1/messages', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'x-api-key': apiKey,
//       'anthropic-version': '2023-06-01',
//     },
//     body: JSON.stringify({
//       model: model || 'claude-3-5-haiku-latest',
//       max_tokens: 1024,
//       messages: messages.map(m => ({ role: m.role, content: m.content })),
//     }),
//   });
//   if (!resp.ok) { const err = await resp.text(); throw new Error(`Anthropic API error (${resp.status}): ${err}`); }
//   const data = await resp.json() as any;
//   const text = data?.content?.[0]?.text;
//   if (!text) throw new Error('Anthropic returned an empty response.');
//   return text;
// }

// ---- Main handler ----
export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResp({ error: 'Method not allowed. Use POST.' }, 405);
  }

  // Enforce CORS origin
  const reqOrigin = req.headers.get('Origin');
  if (reqOrigin !== ORIGIN) {
    return jsonResp({ error: 'Origin not allowed.' }, 403);
  }

  // Rate limit by IP
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

  // Parse request body
  let body: ChatRequestBody;
  try {
    body = await req.json() as ChatRequestBody;
  } catch {
    return jsonResp({ error: 'Invalid JSON body.' }, 400);
  }

  const provider = body.provider || 'gemini';
  const model = body.model || DEFAULT_MODEL;
  const messages = body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return jsonResp({ error: 'Messages array is required.' }, 400);
  }

  try {
    let reply: string;
    const apiKey = process.env.GEMINI_API_KEY;

    switch (provider) {
      case 'gemini':
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
        reply = await callGemini(apiKey, model, messages);
        break;

      // Disabled: no free tier as of 2026, requires billing enabled.
      // Uncomment and add the API key as a secret to enable.
      //
      // case 'openai':
      //   const openaiKey = process.env.OPENAI_API_KEY;
      //   if (!openaiKey) throw new Error('OPENAI_API_KEY is not set.');
      //   reply = await callOpenAI(openaiKey, model, messages);
      //   break;
      //
      // case 'anthropic':
      //   const anthropicKey = process.env.ANTHROPIC_API_KEY;
      //   if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY is not set.');
      //   reply = await callAnthropic(anthropicKey, model, messages);
      //   break;

      default:
        return jsonResp({ error: `Unknown provider: ${provider}. Available: gemini` }, 400);
    }

    return jsonResp({
      reply,
      provider,
      model,
      rateRemaining: rl.remaining,
    });

  } catch (err) {
    return jsonResp({
      error: (err as Error).message || 'An unexpected error occurred.',
      provider,
    }, 502);
  }
}
