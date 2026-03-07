import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getSchemeSummaryForAI } from '../../../lib/schemes';

// Amazon Nova Pro — first-party AWS model, no Marketplace subscription required
const BEDROCK_MODEL = 'amazon.nova-pro-v1:0';

const getClient = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }
  return new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

const LANGUAGE_LABELS = { hi: 'Hindi (हिंदी)', kn: 'Kannada (ಕನ್ನಡ)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)', en: 'English' };

const SYSTEM_PROMPT = (schemesJson, language) => {
  const langLabel = LANGUAGE_LABELS[language] || 'Hindi (हिंदी)';
  return `You are Yojna-Setu (योजना-सेतु), a caring and helpful AI assistant that helps rural Indians discover government welfare schemes they are eligible for.

LANGUAGE INSTRUCTION: The user has selected ${langLabel} as their interface language. You MUST respond ONLY in ${langLabel}. Do not switch to any other language regardless of what the user types.

GOVERNMENT SCHEMES DATABASE:
${schemesJson}

YOUR TASK:
1. Listen to the user describe their situation (location, occupation, income, family, age, etc.)
2. Ask gentle follow-up questions if you need more information
3. Match them with relevant schemes from the database above
4. Explain the benefits clearly in simple language they can understand
5. Tell them exactly how to apply (documents needed, where to go)

MESSAGE FORMAT RULES (critical — the message field must follow this structure):
1. Start with ONE short warm sentence acknowledging the user's situation.
2. For each matched scheme, write it as a bullet like this:
   • **Scheme Name** — benefit amount/description. How to apply in one sentence.
3. End with ONE short encouraging sentence.
4. Use bullet points (•) for ALL scheme listings — NEVER write them as a long paragraph.
5. Keep each bullet to 2 sentences max. No walls of text.
6. Use **bold** (double asterisks) only for scheme names.

RESPONSE FORMAT (ALWAYS respond with valid JSON):
{
  "message": "One warm sentence.\\n\\n• **Scheme 1** — benefit. How to apply.\\n• **Scheme 2** — benefit. How to apply.\\n\\nOne closing sentence.",
  "detected_language": "hi|kn|ta|te|en",
  "matched_scheme_ids": ["scheme-id-1", "scheme-id-2"],
  "extracted_profile": {
    "state": "detected state if mentioned",
    "occupation": "detected occupation",
    "income_category": "BPL/APL/unknown",
    "age": "detected age if mentioned",
    "gender": "male/female/unknown",
    "family_size": "number if mentioned",
    "has_ration_card": true/false/null,
    "has_land": true/false/null,
    "is_farmer": true/false/null,
    "is_widow": true/false/null,
    "has_disability": true/false/null,
    "has_girl_child": true/false/null,
    "is_pregnant": true/false/null,
    "is_student": true/false/null
  },
  "follow_up_needed": true/false,
  "follow_up_question": "Next question to ask in user's language (only if follow_up_needed is true)"
}

IMPORTANT RULES:
- Always be warm, respectful and encouraging
- Use simple words, avoid bureaucratic language
- ALWAYS respond in ${langLabel} — never switch languages
- ALWAYS use bullet points (•) for scheme listings — NEVER a continuous paragraph
- Match schemes accurately - don't suggest schemes they clearly don't qualify for
- Mention the benefit amount clearly in each bullet (e.g., ₹6,000/year)
- If unsure about eligibility, still mention the scheme but note the condition
- Always end with an encouragement to apply
- For first message with very little info, ask key questions: state, occupation, income level
- Do NOT suggest Atal Pension Yojana or other retirement pension schemes to students or anyone under 25 years of age
- Do NOT suggest MGNREGA to urban residents or salaried employees`;
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, language } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const client = getClient();

    if (!client) {
      return Response.json({
        error: 'AWS credentials not configured. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local',
        setup_instructions: 'Go to AWS Console → IAM → Create user with BedrockFullAccess + PollyAccess policies',
      }, { status: 503 });
    }

    const schemesJson = JSON.stringify(getSchemeSummaryForAI(), null, 2);
    const systemPrompt = SYSTEM_PROMPT(schemesJson, language);

    // Nova Pro uses the Bedrock Converse API.
    // Each message's content must be an array of content blocks: [{ text: "..." }]
    const converseMessages = messages.map((msg) => ({
      role: msg.role,
      content: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
    }));

    const command = new ConverseCommand({
      modelId: BEDROCK_MODEL,
      system: [{ text: systemPrompt }],
      messages: converseMessages,
      inferenceConfig: { maxTokens: 1500 },
    });

    const response = await client.send(command);
    const rawContent = response.output.message.content[0].text;

    let parsed;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      parsed = {
        message: rawContent,
        detected_language: language || 'hi',
        matched_scheme_ids: [],
        extracted_profile: {},
        follow_up_needed: false,
        follow_up_question: null,
      };
    }

    return Response.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Chat API error:', error);

    // Helpful error messages for common Bedrock issues
    const msg = error.message || '';
    let userFacingError = 'Failed to process request';

    if (msg.includes('AccessDeniedException') || msg.includes('not authorized')) {
      userFacingError = 'AWS IAM permissions error. Make sure your IAM user has AmazonBedrockFullAccess policy.';
    } else if (msg.includes('ResourceNotFoundException') || msg.includes('model')) {
      userFacingError = `Model not available in your region. Try changing AWS_REGION to us-east-1 in .env.local`;
    } else if (msg.includes('ExpiredTokenException') || msg.includes('InvalidSignature')) {
      userFacingError = 'AWS credentials invalid or expired. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.';
    }

    return Response.json({
      error: userFacingError,
      details: error.message,
    }, { status: 500 });
  }
}
