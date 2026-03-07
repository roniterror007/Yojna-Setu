/**
 * Req 9.5 — AWS Lambda Handler: Chat / Scheme Matching
 *
 * This Lambda function replicates the logic in app/api/chat/route.js
 * so it can run standalone behind API Gateway without Next.js.
 *
 * Deploy steps:
 *   1. zip -r chat-lambda.zip chat-handler.js node_modules/
 *   2. aws lambda create-function \
 *        --function-name yojna-setu-chat \
 *        --runtime nodejs20.x \
 *        --handler chat-handler.handler \
 *        --zip-file fileb://chat-lambda.zip \
 *        --role arn:aws:iam::<ACCOUNT_ID>:role/YojnaSetu-Lambda-Role
 *   3. Attach API Gateway HTTP API with route POST /chat
 *
 * Required IAM permissions for the Lambda role:
 *   - bedrock:InvokeModel (Amazon Nova Pro)
 *   - polly:SynthesizeSpeech
 *   - s3:GetObject, s3:PutObject (for schemes + audio)
 *   - transcribe:StartTranscriptionJob, transcribe:GetTranscriptionJob
 */

'use strict';

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

const BEDROCK_MODEL = 'amazon.nova-pro-v1:0';
const LANGUAGE_LABELS = { hi: 'Hindi (हिंदी)', kn: 'Kannada (ಕನ್ನಡ)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)', en: 'English' };

// Inline schemes summary for Lambda (no file system access needed)
// In production, fetch this from S3 at cold start and cache it.
const SCHEMES_SUMMARY = require('./schemes-summary.json');

const SYSTEM_PROMPT = (schemesJson, language) => {
  const langLabel = LANGUAGE_LABELS[language] || 'Hindi (हिंदी)';
  return `You are Yojna-Setu (योजना-सेतु), a caring AI assistant that helps rural Indians discover government welfare schemes.

LANGUAGE: Respond ONLY in ${langLabel}.

SCHEMES DATABASE:
${schemesJson}

RESPONSE FORMAT (valid JSON):
{
  "message": "...",
  "detected_language": "hi|kn|ta|te|en",
  "matched_scheme_ids": [],
  "extracted_profile": {},
  "follow_up_needed": false,
  "follow_up_question": null
}

RULES:
- Always respond in ${langLabel}
- Use bullet points (•) for scheme listings
- Keep responses concise and warm
- Mention benefit amounts clearly (e.g. ₹6,000/year)`;
};

// Lambda response cache (in-memory, per warm container)
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { messages, language = 'hi' } = body;

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid messages' }) };
    }

    // Cache check
    const lastMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const key = `${language}:${lastMsg.slice(0, 80).toLowerCase()}`;
    const cached = cache.get(key);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, data: { ...cached.data, from_cache: true } }) };
    }

    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const schemesJson = JSON.stringify(SCHEMES_SUMMARY, null, 2);
    const systemPrompt = SYSTEM_PROMPT(schemesJson, language);

    const converseMessages = messages.map(msg => ({
      role: msg.role,
      content: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
    }));

    const response = await client.send(new ConverseCommand({
      modelId: BEDROCK_MODEL,
      system: [{ text: systemPrompt }],
      messages: converseMessages,
      inferenceConfig: { maxTokens: 1500 },
    }));

    const rawContent = response.output.message.content[0].text;

    let parsed;
    try {
      const match = rawContent.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { message: rawContent, detected_language: language, matched_scheme_ids: [], extracted_profile: {}, follow_up_needed: false };
    } catch {
      parsed = { message: rawContent, detected_language: language, matched_scheme_ids: [], extracted_profile: {}, follow_up_needed: false };
    }

    // Cache result
    if (cache.size >= 200) cache.delete(cache.keys().next().value);
    cache.set(key, { data: parsed, ts: Date.now() });

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, data: parsed }) };
  } catch (error) {
    console.error('Lambda chat error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal error' }),
    };
  }
};
