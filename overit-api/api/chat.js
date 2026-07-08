import { jwtVerify } from 'jose';

export const config = { runtime: 'edge' };

const ANTHROPIC      = 'https://api.anthropic.com/v1/messages';
const MODEL          = 'claude-sonnet-4-6';
const MAX_TOKENS     = 1000;
const MAX_TOOL_LOOPS = 6;
const MAX_RETRIES     = 3;

async function callAnthropic(body) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(ANTHROPIC, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta':    'web-search-2025-03-05',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error?.type === 'overloaded_error' && attempt < MAX_RETRIES - 1) {
      lastError = data.error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      continue;
    }

    if (data.error) throw new Error(data.error.message);

    return data;
  }

  throw new Error(lastError?.message || 'Anthropic overloaded after retries');
}

async function verifyJWT(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No token');
  const token  = authHeader.slice(7);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    await verifyJWT(req.headers.get('authorization'));
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unauthorized', detail: err.message }), { status: 401 });
  }

  const { messages, systemPrompt, profilePrompt } = await req.json();
  if (!messages || !systemPrompt) {
    return new Response(JSON.stringify({ error: 'messages and systemPrompt required' }), { status: 400 });
  }

  try {
    let cur  = messages.map(m => ({ role: m.role, content: m.content }));
    let text = '';

    for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
      const data = await callAnthropic({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: profilePrompt || '' },
        ],
        tools:      [{ type: 'web_search_20250305', name: 'web_search' }],
        messages:   cur,
      });

      text += (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      if (data.stop_reason !== 'tool_use') break;

      const toolResults = (data.content || [])
        .filter(b => b.type === 'tool_use')
        .map(b => ({ type: 'tool_result', tool_use_id: b.id, content: 'done' }));

      cur = [
        ...cur,
        { role: 'assistant', content: data.content },
        { role: 'user',      content: toolResults },
      ];
    }

    return new Response(
      JSON.stringify({ text: text.trim() || "I'm here. Take your time." }),
      {
        status:  200,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('[chat]', err.message);
    return new Response(
      JSON.stringify({ error: 'AI response failed: ' + err.message }),
      {
        status:  500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
