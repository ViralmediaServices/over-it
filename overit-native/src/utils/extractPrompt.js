export const EXTRACT_SYSTEM = `Extract structured emotional profile data from conversations. Return ONLY valid JSON — no markdown, no backticks, no explanation whatsoever.`;

export const EXTRACT_PROMPT = `Extract what you have genuinely learned about this person from the conversation. Return JSON with only fields where you have real evidence. Omit missing fields entirely. No null values. Return {} if insufficient data.

For attachmentStyle, look for these behavioral signals:
- ANXIOUS: fears abandonment, seeks reassurance, catastrophizes, monitors ex closely, difficulty accepting the loss, rumination
- AVOIDANT: minimizes pain, values independence, intellectualizes, pulls back when things get emotional, dismisses need for support
- SECURE: can hold complexity, open to insight, balanced view of ex, able to self-soothe
- DISORGANIZED: contradicts themselves, swings between extremes, confused about what they want, trauma responses
- Use combinations like "anxious-avoidant" or "anxious with avoidant traits" when evidence supports mixed styles

Schema:
{
  "attachmentStyle": "anxious|avoidant|secure|disorganized|anxious-avoidant|anxious with avoidant traits",
  "attachmentSignals": ["specific behaviors or phrases that reveal their attachment pattern"],
  "currentGriefStage": "denial|anger|bargaining|depression|acceptance|moving forward",
  "coreWounds": ["deepest fears or pain points revealed"],
  "triggersIdentified": ["specific things intensifying their pain"],
  "copingStrategiesWorking": ["things genuinely helping them"],
  "keyThemes": ["recurring emotional themes in their words"],
  "progressNote": "one honest sentence on where they are emotionally right now"
}

Conversation:`;
