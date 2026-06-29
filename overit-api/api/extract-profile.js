const { requireAuth, handleOptions } = require('./_auth');

const ANTHROPIC = 'https://api.anthropic.com/v1/messages';

const EXTRACT_SYSTEM = `Extract structured emotional profile data from conversations. Return ONLY valid JSON — no markdown, no backticks, no explanation whatsoever.`;

const EXTRACT_PROMPT = `Extract what you've genuinely learned about this person. Return JSON with only fields where you have real evidence. Omit missing fields. No null values. Return {} if insufficient data.

Schema:
{
  "attachmentStyle": "anxious|avoidant|secure|disorganized",
  "currentGriefStage": "denial|anger|bargaining|depression|acceptance|moving forward",
  "coreWounds": ["e.g. abandonment", "self-worth"],
  "triggersIdentified": ["things intensifying their pain"],
  "copingStrategiesWorking": ["things genuinely helping"],
  "keyThemes": ["recurring emotional themes"],
  "progressNote": "one sentence on their emotional trajectory"
}

Conversation:`;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { excerpt } = req.body || {};
  if (!excerpt) return res.json({ extracted: {} });

  try {
    const response = await fetch(ANTHROPIC, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 500,
        system:     EXTRACT_SYSTEM,
        messages:   [{ role: 'user', content: `${EXTRACT_PROMPT}\n\n${excerpt}` }],
      }),
    });

    const data    = await response.json();
    const raw     = data.content?.find(b => b.type === 'text')?.text || '{}';
    const cleaned = raw.replace(/```[\s\S]*?```/g, '').replace(/`/g, '').trim();

    return res.json({ extracted: JSON.parse(cleaned) });
  } catch (err) {
    console.error('[extract-profile]', err.message);
    return res.json({ extracted: {} });
  }
};
