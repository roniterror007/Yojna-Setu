import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getSchemeSummaryForAI } from '../../../lib/schemes';
import { getSchemesFromS3OrLocal } from '../../../lib/s3-schemes';

// Amazon Nova Pro — first-party AWS model, no Marketplace subscription required
const BEDROCK_MODEL = 'amazon.nova-pro-v1:0';

// ── Req 7.4: In-memory response cache ────────────────────────────────────────
// Key: hash(lastUserMessage + language), Value: { data, timestamp }
const responseCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cacheKey(lastMsg, lang) {
  // Simple key: first 80 chars of message + language
  return `${lang}:${(lastMsg || '').slice(0, 80).toLowerCase().trim()}`;
}

// Fallback responses when AWS is completely unavailable (Req 7.4)
const FALLBACK_RESPONSES = {
  hi: {
    message: 'नमस्ते! 🙏 अभी सेवा अस्थायी रूप से उपलब्ध नहीं है। आप इन लोकप्रिय योजनाओं की जांच कर सकते हैं:\n\n• **PM-KISAN** — किसानों को ₹6,000/वर्ष। pmkisan.gov.in पर आवेदन करें।\n• **Ayushman Bharat** — BPL परिवारों को ₹5 लाख तक का स्वास्थ्य बीमा। hospitals.pmjay.gov.in\n• **MGNREGA** — गांव में 100 दिन का रोजगार ₹220/दिन। ग्राम पंचायत में जाएं।\n• **PM-MUDRA** — छोटे व्यापार के लिए ₹50,000 से ₹10 लाख तक ऋण।\n\nकृपया इंटरनेट जांचें और दोबारा कोशिश करें।',
    detected_language: 'hi',
    matched_scheme_ids: ['pm-kisan', 'ayushman-bharat', 'mgnrega', 'pm-mudra'],
    extracted_profile: {},
    follow_up_needed: false,
    follow_up_question: null,
    is_fallback: true,
  },
  en: {
    message: "Hello! 🙏 The service is temporarily unavailable. Here are popular schemes you can explore:\n\n• **PM-KISAN** — ₹6,000/year for farmers. Apply at pmkisan.gov.in\n• **Ayushman Bharat** — ₹5 lakh health insurance for BPL families.\n• **MGNREGA** — 100 days rural employment at ₹220/day.\n• **PM-MUDRA** — Business loans from ₹50,000 to ₹10 lakh.\n\nPlease check your internet connection and try again.",
    detected_language: 'en',
    matched_scheme_ids: ['pm-kisan', 'ayushman-bharat', 'mgnrega', 'pm-mudra'],
    extracted_profile: {},
    follow_up_needed: false,
    follow_up_question: null,
    is_fallback: true,
  },
};
FALLBACK_RESPONSES.kn = { ...FALLBACK_RESPONSES.hi, detected_language: 'kn',
  message: 'ನಮಸ್ಕಾರ! 🙏 ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ಈ ಜನಪ್ರಿಯ ಯೋಜನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ:\n\n• **PM-KISAN** — ರೈತರಿಗೆ ₹6,000/ವರ್ಷ.\n• **Ayushman Bharat** — BPL ಕುಟುಂಬಗಳಿಗೆ ₹5 ಲಕ್ಷ ಆರೋಗ್ಯ ವಿಮೆ.\n• **MGNREGA** — 100 ದಿನ ಗ್ರಾಮೀಣ ಉದ್ಯೋಗ.\n\nಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' };
FALLBACK_RESPONSES.ta = { ...FALLBACK_RESPONSES.hi, detected_language: 'ta',
  message: 'வணக்கம்! 🙏 சேவை தற்காலிகமாக கிடைக்கவில்லை. இந்த திட்டங்களை பாருங்கள்:\n\n• **PM-KISAN** — விவசாயிகளுக்கு ₹6,000/ஆண்டு.\n• **Ayushman Bharat** — BPL குடும்பங்களுக்கு ₹5 லட்சம் சுகாதார காப்பீடு.\n• **MGNREGA** — 100 நாள் ஊரக வேலைவாய்ப்பு.\n\nஇணையத்தை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.' };
FALLBACK_RESPONSES.te = { ...FALLBACK_RESPONSES.hi, detected_language: 'te',
  message: 'నమస్కారం! 🙏 సేవ తాత్కాలికంగా అందుబాటులో లేదు. ఈ పథకాలను చూడండి:\n\n• **PM-KISAN** — రైతులకు ₹6,000/సంవత్సరం.\n• **Ayushman Bharat** — BPL కుటుంబాలకు ₹5 లక్షల ఆరోగ్య బీమా.\n• **MGNREGA** — 100 రోజుల గ్రామీణ ఉపాధి.\n\nఇంటర్నెట్ తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి.' };

const getClient = () => {
  if (!process.env.YOJNA_AWS_KEY || !process.env.YOJNA_AWS_SECRET) {
    return null;
  }
  return new BedrockRuntimeClient({
    region: process.env.YOJNA_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.YOJNA_AWS_KEY,
      secretAccessKey: process.env.YOJNA_AWS_SECRET,
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

ELIGIBILITY SIMPLIFICATION (Req 10.3):
- Break eligibility into simple YES/NO questions when asking follow-ups. Examples:
  • "क्या आपके पास राशन कार्ड है? (हाँ/नहीं)" | "Do you have a ration card? (Yes/No)"
  • "क्या आपकी ज़मीन 2 हेक्टेयर से कम है? (हाँ/नहीं)"
- List complex eligibility as checkboxes: ✓ for confirmed, ? for unknown, ✗ for not met.

LOCATION-SPECIFIC BENEFITS (Req 10.4):
- When the user mentions their state, provide state-specific amounts where applicable:
  • MGNREGA: UP ₹213/day, Karnataka ₹309/day, Kerala ₹333/day, Tamil Nadu ₹256/day, Andhra ₹257/day, Maharashtra ₹273/day
  • PMAY-G: plains ₹1.20 lakh, hilly/NE states ₹1.30 lakh
  • Pensions (IGNOAPS/widow/disability): central base + state top-up (varies by state, can be ₹500–₹2000+ total)
- If state is unknown, show central base amount and note "your state adds an additional top-up".

TIME-SENSITIVE REQUIREMENTS (Req 10.5):
- ALWAYS flag deadlines with ⚠️:
  • PMMVY: ⚠️ Register at Anganwadi within 150 days of pregnancy
  • PM Fasal Bima: ⚠️ Apply before seasonal cutoff (Kharif: July, Rabi: December)
  • NSP Scholarship: ⚠️ Applications open Oct–Nov each year
  • Kisan Credit Card: ⚠️ Apply before crop sowing season
- If no deadline: reassure "आप कभी भी आवेदन कर सकते हैं / You can apply anytime"

CONFLICT DETECTION (Req 2.3):
- If user provides contradictory info (e.g., "government employee" + asking for PM-KISAN), gently flag:
  "आपने सरकारी नौकरी का ज़िक्र किया — PM-KISAN सरकारी कर्मचारियों के लिए उपलब्ध नहीं है। क्या आप अपनी मुख्य नौकरी स्पष्ट कर सकते हैं?"
- Always seek clarification before recommending schemes the user may not qualify for.

CONVERSATION SUMMARY (Req 5.5):
- After 3+ conversation turns, if the user's message is unclear, briefly summarize what you know:
  "मैंने आपके बारे में यह समझा: [राज्य], [काम], [आय], [परिवार]। क्या यह सही है?"
  ("Let me confirm: [state], [occupation], [income], [family details]. Is this right?")
- Confirm the profile summary before making final recommendations.

RESPONSE FORMAT (ALWAYS respond with valid JSON):
{
  "message": "One warm sentence.\\n\\n• **Scheme 1** — benefit. How to apply.\\n• **Scheme 2** — benefit. How to apply.\\n\\nOne closing sentence.",
  "detected_language": "hi|kn|ta|te|en",
  "matched_scheme_ids": ["scheme-id-1", "scheme-id-2"],
  // CRITICAL: matched_scheme_ids MUST list the ID of EVERY scheme you mention in your message. Include on every reply — even follow-ups. Use exact IDs from the database (e.g. "pmsby", "pmjjby", "pm-jan-dhan", "pm-kisan", etc.). Never leave this empty if you mention any scheme.
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
  "follow_up_question": "Next simple YES/NO question in user's language (only if follow_up_needed is true)"
}

NEAREST APPLICATION CENTERS (PDF USP — Location-Specific Guidance):
- ALWAYS include "How to apply" guidance with specific locations:
  • Common Service Centres (CSC): "नजदीकी CSC केंद्र में जाएं" — available in every Gram Panchayat
  • Gram Panchayat Office: For MGNREGA job card, PMAY-G, pension schemes
  • Anganwadi Centre: For PMMVY, ICDS nutrition schemes, PM Poshan
  • Bank/Post Office: For PM-KISAN, PM-MUDRA, Jan Dhan accounts
  • Jan Aushadhi Kendra: For generic medicines under Pradhan Mantri Bhartiya Janaushadhi Pariyojana
  • Ration Shop (PDS): For PM Garib Kalyan Anna Yojana, Antyodaya cards
  • School/College: For National Scholarship Portal (NSP), PM Vidyalakshmi
  • Nearest Krishi Vigyan Kendra (KVK): For agricultural schemes
- If user mentions their district/block, say: "अपने [district] के CSC केंद्र पर जाएं या cscindia.org पर खोजें"
- Always mention: "आप umang.gov.in या DigiLocker पर ऑनलाइन भी आवेदन कर सकते हैं"

SCHEME COVERAGE (Comprehensive Database Context):
- Our curated database has 21 flagship central government schemes. However, you can also inform users about:
  • State government schemes: Each state has 50–200+ additional schemes. For specific state schemes, direct them to their state's official portal (e.g., up.gov.in, karnataka.gov.in, tnschemes.in, ap.gov.in, telangana.gov.in)
  • myscheme.gov.in: National portal with 700+ central and state schemes — recommend this for comprehensive search
  • Jan Samarth Portal (jansamarth.in): 13 credit-linked government schemes
  • UMANG App: Access 1,200+ government services from one app
  • When a user's situation suggests a scheme not in our database, say: "इसके अलावा, आप myscheme.gov.in पर जाकर अपनी स्थिति के लिए और योजनाएँ खोज सकते हैं"

IMPORTANT RULES:
- Always be warm, respectful and encouraging
- Use simple words, avoid bureaucratic language
- ALWAYS respond in ${langLabel} — never switch languages
- ALWAYS use bullet points (•) for scheme listings — NEVER a continuous paragraph
- Match schemes accurately - don't suggest schemes they clearly don't qualify for
- Mention the benefit amount clearly; use state-specific amounts when state is known
- If unsure about eligibility, still mention the scheme but note the condition
- Always end with an encouragement to apply AND nearest application center
- For first message with very little info, ask key questions: state, occupation, income level
- Do NOT suggest Atal Pension Yojana or other retirement pension schemes to students or anyone under 25 years of age
- Do NOT suggest MGNREGA to urban residents or salaried employees
- When conflicts are detected, flag them gently before recommending schemes
- ALWAYS add ⚠️ for time-sensitive deadlines
- ALWAYS mention the nearest physical center (CSC/Gram Panchayat/Anganwadi) to apply
- ALWAYS mention myscheme.gov.in or state portal for additional schemes beyond the 21 listed`;
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
        debug: { hasKey: !!process.env.YOJNA_AWS_KEY, hasSecret: !!process.env.YOJNA_AWS_SECRET, region: process.env.YOJNA_AWS_REGION || 'NOT SET' },
      }, { status: 503 });
    }

    // Req 7.4 — Check cache before calling Bedrock
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const key = cacheKey(lastUserMsg, language);
    const cached = responseCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return Response.json({ success: true, data: { ...cached.data, from_cache: true } });
    }

    // Req 9.4 — Use S3 schemes if available (falls back to local JSON)
    const allSchemes = await getSchemesFromS3OrLocal();
    const schemesSummary = allSchemes.map(s => ({
      id: s.id, name: s.name, fullName: s.fullName, category: s.category,
      benefit: s.benefit, eligibility: s.eligibility, tags: s.tags,
    }));
    const schemesJson = JSON.stringify(schemesSummary, null, 2);
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

    // Req 7.4 — Store successful response in cache (limit cache size to 200 entries)
    if (responseCache.size >= 200) {
      const firstKey = responseCache.keys().next().value;
      responseCache.delete(firstKey);
    }
    responseCache.set(key, { data: parsed, timestamp: Date.now() });

    return Response.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Chat API error:', error);

    // Req 7.4 — Return fallback response when Bedrock is down
    const effectiveLang = (request.headers.get('x-language') || 'hi');
    const fallback = FALLBACK_RESPONSES[effectiveLang] || FALLBACK_RESPONSES.hi;

    // Re-parse body language if available
    try {
      const body2 = await request.clone().json().catch(() => ({}));
      const lang2 = body2?.language || effectiveLang;
      const fallback2 = FALLBACK_RESPONSES[lang2] || FALLBACK_RESPONSES.hi;
      // Only return fallback for connectivity/service errors, not invalid requests
      const msg = error.message || '';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONNREFUSED')
        || msg.includes('ThrottlingException') || msg.includes('ServiceUnavailable')
        || msg.includes('timeout')) {
        return Response.json({ success: true, data: fallback2 });
      }
    } catch (_) {}

    // Helpful error messages for common Bedrock issues
    const msg = error.message || '';
    let userFacingError = 'Failed to process request';

    if (msg.includes('AccessDeniedException') || msg.includes('not authorized')) {
      userFacingError = 'AWS IAM permissions error. Make sure your IAM user has AmazonBedrockFullAccess policy.';
    } else if (msg.includes('ResourceNotFoundException') || msg.includes('model')) {
      userFacingError = `Model not available in your region. Try changing AWS_REGION to us-east-1 in .env.local`;
    } else if (msg.includes('ExpiredTokenException') || msg.includes('InvalidSignature')) {
      userFacingError = 'AWS credentials invalid or expired. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.';
    } else if (msg.includes('ThrottlingException') || msg.includes('ServiceUnavailable')) {
      // Return fallback for throttling/service down
      return Response.json({ success: true, data: fallback });
    }

    return Response.json({
      error: userFacingError,
      details: error.message,
    }, { status: 500 });
  }
}
