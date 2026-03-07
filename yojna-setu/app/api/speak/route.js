// TTS API Route - AWS Polly (hi/en) + Google Translate TTS (kn/ta/te)
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

// Polly voices for hi and en
const VOICE_MAP = {
  hi: { VoiceId: 'Kajal',   LanguageCode: 'hi-IN', Engine: 'neural'   },
  en: { VoiceId: 'Raveena', LanguageCode: 'en-IN', Engine: 'standard' },
};

// Google Translate TTS language codes (kn/ta/te have no Polly voice; en-in for Indian English)
const GTTS_LANG = { kn: 'kn', ta: 'ta', te: 'te', en: 'en-in' };

// Browser TTS fallback codes
const BROWSER_LANG_MAP = { hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', en: 'en-IN' };

async function fetchGoogleTTSChunks(text, langCode) {
  // Split into sentence-level chunks ≤ 190 chars each
  const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > 190 && cur) { chunks.push(cur.trim()); cur = s; }
    else cur += s;
  }
  if (cur.trim()) chunks.push(cur.trim());

  const base64Chunks = [];
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${langCode}&client=tw-ob`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://translate.google.com/' },
    });
    if (!res.ok) throw new Error(`Google TTS ${res.status}`);
    base64Chunks.push(Buffer.from(await res.arrayBuffer()).toString('base64'));
  }
  return base64Chunks;
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { text, language = 'hi' } = body;

  if (!text) return Response.json({ error: 'Text is required' }, { status: 400 });

  // ── Google Translate TTS for Kannada / Tamil / Telugu / English (Indian accent) ──
  if (GTTS_LANG[language]) {
    try {
      const chunks = await fetchGoogleTTSChunks(text.slice(0, 1000), GTTS_LANG[language]);
      return Response.json({ success: true, source: 'chunks', chunks, mimeType: 'audio/mpeg', language, browserLang: BROWSER_LANG_MAP[language] });
    } catch (err) {
      console.error('Google TTS error:', err.message);
      // For kn/ta/te fall straight to browser; for English try Polly next
      if (language !== 'en') {
        return Response.json({ success: true, source: 'browser', text, language, browserLang: BROWSER_LANG_MAP[language] });
      }
    }
  }

  // ── AWS Polly for Hindi (and English fallback if Google TTS failed) ─────────
  const hasAWSConfig = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION;
  if (hasAWSConfig && VOICE_MAP[language]) {
    try {
      const pollyClient = new PollyClient({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
      });
      const voice = VOICE_MAP[language];
      const command = new SynthesizeSpeechCommand({
        Text: text.slice(0, 3000),
        OutputFormat: 'mp3',
        VoiceId: voice.VoiceId,
        LanguageCode: voice.LanguageCode,
        Engine: voice.Engine,
      });
      const response = await pollyClient.send(command);
      const chunks = [];
      for await (const chunk of response.AudioStream) chunks.push(chunk);
      const base64Audio = Buffer.concat(chunks).toString('base64');
      return Response.json({ success: true, source: 'polly', audioData: base64Audio, mimeType: 'audio/mpeg', language, browserLang: BROWSER_LANG_MAP[language] || 'hi-IN' });
    } catch (err) {
      console.error('Polly error:', err.message);
    }
  }

  // ── Browser TTS fallback ───────────────────────────────────────────────────
  return Response.json({ success: true, source: 'browser', text, language, browserLang: BROWSER_LANG_MAP[language] || 'hi-IN' });
}
