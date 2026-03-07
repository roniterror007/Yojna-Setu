'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, RefreshCw, Volume2, VolumeX, HelpCircle, X, WifiOff, ChevronUp, Languages } from 'lucide-react';
import VoiceButton from '../../components/VoiceButton';
import SchemeCard from '../../components/SchemeCard';
import SamplePrompts from '../../components/SamplePrompts';
import { allSchemes } from '../../lib/schemes';

// ── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'hi', name: 'हिंदी',   roman: 'Hindi',   greeting: 'नमस्ते'    },
  { code: 'kn', name: 'ಕನ್ನಡ',   roman: 'Kannada', greeting: 'ನಮಸ್ಕಾರ' },
  { code: 'ta', name: 'தமிழ்',   roman: 'Tamil',   greeting: 'வணக்கம்'  },
  { code: 'te', name: 'తెలుగు',  roman: 'Telugu',  greeting: 'నమస్కారం' },
  { code: 'en', name: 'English', roman: 'English', greeting: 'Hello'     },
];

// ── UI strings ────────────────────────────────────────────────────────────────
const UI_STRINGS = {
  hi: {
    placeholder: 'अपनी स्थिति बताएं...',
    reset: 'नई बातचीत',
    welcome: 'नमस्ते! मैं योजना-सेतु हूँ 🙏\n\nबस अपनी स्थिति बताएं. राज्य, काम, परिवार बताएं और मैं आपके लिए सरकारी योजनाएँ खोजूँगा।',
    error: 'माफ़ करें, कुछ गड़बड़ हुई। दोबारा कोशिश करें।',
    networkError: 'नेटवर्क की समस्या है। इंटरनेट जांचें।',
    awsError: 'सेवा अभी उपलब्ध नहीं। कुछ देर बाद कोशिश करें।',
    partLabel: 'भाग',
    waitTime: '~3-8 सेकंड',
    offline: 'इंटरनेट नहीं है। नेटवर्क जांचें।',
    appName: 'योजना-सेतु',
    helpTitle: 'कैसे उपयोग करें',
    helpSteps: ['🎤 माइक दबाएं और बोलें', '📝 या नीचे टाइप करें', '🏛️ AI योजनाएँ खोजेगा', '🔊 Listen दबाएं जवाब सुनें', '🌐 ऊपर से भाषा बदलें'],
    schemesFound: 'मिलीं योजनाएँ',
    langChanged: 'भाषा बदली. नई बातचीत शुरू हुई',
    chooseLang: 'अपनी भाषा चुनें',
  },
  kn: {
    placeholder: 'ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ ಹೇಳಿ...',
    reset: 'ಹೊಸ ಸಂಭಾಷಣೆ',
    welcome: 'ನಮಸ್ಕಾರ! ನಾನು ಯೋಜನ-ಸೇತು 🙏\n\nನಿಮ್ಮ ರಾಜ್ಯ, ವೃತ್ತಿ, ಕುಟುಂಬದ ಬಗ್ಗೆ ತಿಳಿಸಿ.',
    error: 'ಕ್ಷಮಿಸಿ, ಏನೋ ತಪ್ಪಾಯಿತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    networkError: 'ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ.',
    awsError: 'ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ. ಸ್ವಲ್ಪ ಕಾದು ಪ್ರಯತ್ನಿಸಿ.',
    partLabel: 'ಭಾಗ',
    waitTime: '~3-8 ಸೆಕೆಂಡ್',
    offline: 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ. ನೆಟ್‌ವರ್ಕ್ ಪರಿಶೀಲಿಸಿ.',
    appName: 'ಯೋಜನ-ಸೇತು',
    helpTitle: 'ಹೇಗೆ ಬಳಸಬೇಕು',
    helpSteps: ['🎤 ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ', '📝 ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ', '🏛️ AI ಯೋಜನೆಗಳನ್ನು ಹುಡುಕುತ್ತದೆ', '🔊 Listen ಒತ್ತಿ ಉತ್ತರ ಕೇಳಿ', '🌐 ಮೇಲೆ ಭಾಷೆ ಬದಲಾಯಿಸಿ'],
    schemesFound: 'ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ',
    langChanged: 'ಭಾಷೆ ಬದಲಾಯಿತು. ಹೊಸ ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭ',
    chooseLang: 'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
  },
  ta: {
    placeholder: 'உங்கள் நிலையை சொல்லுங்கள்...',
    reset: 'புதிய உரையாடல்',
    welcome: 'வணக்கம்! நான் யோஜனா-சேது 🙏\n\nஉங்கள் மாநிலம், தொழில், குடும்பம் பற்றி சொல்லுங்கள்.',
    error: 'மன்னிக்கவும், ஏதோ தவறு. மீண்டும் முயற்சிக்கவும்.',
    networkError: 'நெட்வொர்க் பிரச்சனை. இணையம் சரிபார்க்கவும்.',
    awsError: 'சேவை இல்லை. சிறிது நேரம் கழித்து முயற்சிக்கவும்.',
    partLabel: 'பகுதி',
    waitTime: '~3-8 விநாடிகள்',
    offline: 'இணையம் இல்லை. நெட்வொர்க் சரிபார்க்கவும்.',
    appName: 'யோஜனா-சேது',
    helpTitle: 'எவ்வாறு பயன்படுத்துவது',
    helpSteps: ['🎤 மைக் அழுத்தி பேசுங்கள்', '📝 அல்லது கீழே தட்டச்சு செய்யுங்கள்', '🏛️ AI திட்டங்கள் தேடும்', '🔊 Listen அழுத்தி கேளுங்கள்', '🌐 மேலே மொழி மாற்றுங்கள்'],
    schemesFound: 'திட்டங்கள் கிடைத்தன',
    langChanged: 'மொழி மாற்றப்பட்டது. புதிய உரையாடல் தொடங்கியது',
    chooseLang: 'மொழியை தேர்வு செய்யுங்கள்',
  },
  te: {
    placeholder: 'మీ పరిస్థితి చెప్పండి...',
    reset: 'కొత్త సంభాషణ',
    welcome: 'నమస్కారం! నేను యోజన-సేతు 🙏\n\nమీ రాష్ట్రం, వృత్తి, కుటుంబం గురించి చెప్పండి.',
    error: 'క్షమించండి, ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి.',
    networkError: 'నెట్‌వర్క్ సమస్య. ఇంటర్నెట్ తనిఖీ చేయండి.',
    awsError: 'సేవ అందుబాటులో లేదు. కొంత సేపు తర్వాత ప్రయత్నించండి.',
    partLabel: 'భాగం',
    waitTime: '~3-8 సెకన్లు',
    offline: 'ఇంటర్నెట్ లేదు. నెట్‌వర్క్ తనిఖీ చేయండి.',
    appName: 'యోజన-సేతు',
    helpTitle: 'ఎలా వాడాలి',
    helpSteps: ['🎤 మైక్ నొక్కి మాట్లాడండి', '📝 లేదా కింద టైప్ చేయండి', '🏛️ AI పథకాలు వెదకుతుంది', '🔊 Listen నొక్కి వినండి', '🌐 పైన భాష మార్చండి'],
    schemesFound: 'పథకాలు దొరికాయి',
    langChanged: 'భాష మారింది. కొత్త సంభాషణ ప్రారంభమైంది',
    chooseLang: 'భాషను ఎంచుకోండి',
  },
  en: {
    placeholder: 'Describe your situation: state, job, family...',
    reset: 'New Chat',
    welcome: "Hello! I'm Yojna-Setu 🙏\n\nTell me about yourself — your state, occupation, family — and I'll find every government scheme you qualify for.",
    error: 'Sorry, something went wrong. Please try again.',
    networkError: 'Network issue. Check your internet connection.',
    awsError: 'Service unavailable. Please try again in a moment.',
    partLabel: 'Part',
    waitTime: '~3-8 seconds',
    offline: 'No internet. Please check your network.',
    appName: 'Yojna-Setu',
    helpTitle: 'How to use',
    helpSteps: ['🎤 Tap mic and speak your situation', '📝 Or type below and press Enter', '🏛️ AI will find matching schemes', '🔊 Tap Listen to hear the response', '🌐 Change language above'],
    schemesFound: 'Schemes found',
    langChanged: 'Language changed. New chat started',
    chooseLang: 'Choose language',
  },
};

// ── Markdown renderer ────────────────────────────────────────────────────────
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function renderMessage(text) {
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-2" />;
    if (/^[•\-\*]\s/.test(t)) return (
      <div key={i} className="flex items-start gap-2 my-1">
        <span className="text-bharat-green mt-0.5 flex-shrink-0">•</span>
        <span className="text-gray-200 text-sm leading-relaxed">{renderInline(t.replace(/^[•\-\*]\s/, ''))}</span>
      </div>
    );
    const nm = t.match(/^(\d+)\.\s(.+)/);
    if (nm) return (
      <div key={i} className="flex items-start gap-2 my-0.5">
        <span className="text-bharat-green/70 text-xs font-mono w-4 flex-shrink-0 mt-0.5">{nm[1]}.</span>
        <span className="text-gray-200 text-sm leading-relaxed">{renderInline(nm[2])}</span>
      </div>
    );
    return <p key={i} className="text-gray-200 text-sm leading-relaxed">{renderInline(t)}</p>;
  });
}

// ── TTS text preprocessing ────────────────────────────────────────────────────
function preprocessForTTS(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#+\s*/g, '')
    .replace(/\p{Emoji}/gu, '')
    .replace(/₹\s*(\d[\d,]*)/g, '$1 rupees')
    .replace(/\/year\b/gi, ' per year')
    .replace(/\/month\b/gi, ' per month')
    .replace(/\/day\b/gi, ' per day')
    .replace(/\/week\b/gi, ' per week')
    .replace(/\//g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Typewriter text ───────────────────────────────────────────────────────────
function TypewriterText({ text, speed = 16 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <div className="flex flex-col gap-0.5">
      {renderMessage(displayed)}
      {!done && (
        <span className="inline-block w-[2px] h-[1em] bg-bharat-green/80 ml-0.5 align-middle rounded-full animate-pulse" />
      )}
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, onSpeak, isSpeaking }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} items-end group`}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <motion.div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md
          ${isUser ? 'bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/25'
                   : 'bg-gradient-to-br from-bharat-green/25 to-emerald-600/20 border border-bharat-green/25'}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {isUser ? '👤' : '🏛️'}
      </motion.div>

      <div className={`max-w-[80%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-md
          ${isUser ? 'bg-gradient-to-br from-blue-600/25 to-indigo-700/20 border border-blue-500/20 rounded-br-md'
                   : 'bg-white/[0.05] border border-white/[0.09] rounded-bl-md'}`}>
          {isUser
            ? <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            : message.typewriter
              ? <TypewriterText text={message.displayText || message.content} />
              : <div className="flex flex-col gap-0.5">{renderMessage(message.displayText || message.content)}</div>}
        </div>

        <div className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isUser ? 'flex-row-reverse' : ''}`}>
          {!isUser && onSpeak && message.displayText && (
            <button onClick={() => onSpeak(message.displayText, message.language)}
              className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 transition-colors
                ${isSpeaking ? 'text-bharat-green bg-bharat-green/10' : 'text-gray-600 hover:text-bharat-green'}`}>
              {isSpeaking ? <VolumeX size={10} /> : <Volume2 size={10} />}
              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>
          )}
          <span className="text-gray-700 text-xs">
            {new Date(message.timestamp || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ waitTime }) {
  return (
    <motion.div className="flex gap-3 items-end"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bharat-green/25 to-emerald-600/20 border border-bharat-green/25 flex items-center justify-center text-sm">🏛️</div>
      <div className="bg-white/[0.05] border border-white/[0.09] rounded-2xl rounded-bl-md px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[0,1,2].map(i => (
              <motion.span key={i} className="block w-2 h-2 rounded-full bg-bharat-green"
                animate={{ y: [0,-8,0], scale: [1,1.2,1], opacity: [0.4,1,0.4] }}
                transition={{ duration: 0.65, repeat: Infinity, delay: i*0.16, ease: 'easeInOut' }} />
            ))}
          </div>
          {waitTime && <span className="text-gray-600 text-xs">{waitTime}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ── Full-screen language picker ───────────────────────────────────────────────
function LanguagePicker({ onSelect }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center mesh-subtle px-6"
      initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35 }}>

      <motion.div className="flex flex-col items-center gap-4 mb-12"
        initial={{ opacity: 0, y: -28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.55, ease: [0.25,1,0.5,1] }}>
        <motion.div
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-bharat-green/30 to-emerald-600/20 border border-bharat-green/30 flex items-center justify-center text-5xl shadow-glow-sm"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          🏛️
        </motion.div>
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tight">Yojna-Setu</h1>
          <p className="text-gray-400 text-base mt-1.5">Voice-first AI for Every Indian</p>
        </div>
      </motion.div>

      <motion.div className="text-center mb-8"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
        <p className="text-white font-semibold text-xl mb-1">Choose your language</p>
        <p className="text-gray-600 text-sm">अपनी भाषा चुनें • ನಿಮ್ಮ ಭಾಷೆ • உங்கள் மொழி • మీ భాష</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
        {LANGUAGES.map((lang, i) => (
          <motion.button key={lang.code} onClick={() => onSelect(lang.code)}
            initial={{ opacity: 0, y: 22, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.28 + i * 0.07, type: 'spring', stiffness: 340, damping: 24 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 py-6 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-bharat-green/50 transition-all duration-200 group cursor-pointer">
            <span className="text-white font-black text-2xl leading-tight">{lang.name}</span>
            <span className="text-gray-500 text-xs group-hover:text-bharat-green transition-colors duration-150">{lang.greeting}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Inline schemes section ────────────────────────────────────────────────────
function SchemesSection({ schemes, language, label }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!schemes.length) return null;

  return (
    <motion.div className="mt-3 mb-2 border-t border-white/[0.06] pt-4"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}>

      <button onClick={() => setCollapsed(v => !v)} className="w-full flex items-center gap-3 mb-4 group">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">🏆</div>
          <span className="text-white font-bold text-sm">{label}</span>
          <span className="bg-bharat-green text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-glow-sm flex-shrink-0">{schemes.length}</span>
        </div>
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}
          className="text-gray-600 group-hover:text-gray-400 flex-shrink-0">
          <ChevronUp size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.25,1,0.5,1] }}
            className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {schemes.map((scheme, i) => (
                <motion.div key={scheme.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 26 }}>
                  <SchemeCard scheme={scheme} language={language} index={i} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Right-sidebar schemes panel ───────────────────────────────────────────────
function SchemesPanel({ schemes, language, label }) {
  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Schemes list */}
      <AnimatePresence>
        {schemes.length > 0 && (
          <motion.div
            className="flex-1 flex flex-col glass-frost border border-white/[0.07] rounded-2xl p-4 overflow-hidden"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          >
            <div className="flex items-center gap-2.5 mb-4 flex-shrink-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/20 flex items-center justify-center text-sm flex-shrink-0">🏆</div>
              <span className="text-white font-bold text-sm flex-1">{label}</span>
              <span className="bg-bharat-green text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-glow-sm flex-shrink-0">{schemes.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {schemes.map((scheme, i) => (
                <motion.div key={scheme.id}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 26 }}>
                  <SchemeCard scheme={scheme} language={language} index={i} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Chat page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [showLangPicker, setShowLangPicker] = useState(true);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [language, setLanguage] = useState('hi');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceResetKey, setVoiceResetKey] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [langNotice, setLangNotice] = useState(null);

  const sessionIdRef = useRef(null);
  const lastInputWasVoiceRef = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);
  const voicesRef = useRef([]);
  const speakTextRef = useRef(null);

  const strings = UI_STRINGS[language] || UI_STRINGS.en;

  useEffect(() => {
    sessionIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  useEffect(() => {
    const off = () => setIsOffline(true);
    const on  = () => setIsOffline(false);
    setIsOffline(!navigator.onLine);
    window.addEventListener('offline', off);
    window.addEventListener('online',  on);
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); };
  }, []);

  useEffect(() => {
    if (!langNotice) return;
    const t = setTimeout(() => setLangNotice(null), 3000);
    return () => clearTimeout(t);
  }, [langNotice]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Show welcome message after language is picked (or when language changes)
  useEffect(() => {
    if (!showLangPicker && !hasStarted) {
      const welcomeText = (UI_STRINGS[language] || UI_STRINGS.en).welcome;
      setMessages([{
        id: 'welcome', role: 'assistant',
        content: welcomeText, displayText: welcomeText,
        language, timestamp: Date.now(), typewriter: true,
      }]);
      // Auto-speak the welcome message after a short delay
      const t = setTimeout(() => speakTextRef.current?.(welcomeText, language, true), 200);
      return () => clearTimeout(t);
    }
  }, [showLangPicker, language]);

  const handlePickLanguage = (code) => {
    setShowLangPicker(false);
    if (code === language) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopAudio();
    setLanguage(code);
    setMessages([]);
    setConversationHistory([]);
    setMatchedSchemes([]);
    setHasStarted(false);
    setInputText('');
    setVoiceResetKey(k => k + 1);
  };

  const handleLanguageChange = (code) => {
    if (code === language) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopAudio();
    setLanguage(code);
    setMessages([]);
    setConversationHistory([]);
    setMatchedSchemes([]);
    setHasStarted(false);
    setInputText('');
    setVoiceResetKey(k => k + 1);
    setLangNotice((UI_STRINGS[code] || UI_STRINGS.en).langChanged);
  };

  const stopAudio = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      const a = audioRef.current;
      audioRef.current = null; // null first so playChunks loop breaks on next iteration check
      a.pause();
      a.dispatchEvent(new Event('ended')); // resolves the stuck await-promise in playChunks
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(async (rawText, lang, force = false) => {
    if (isSpeaking && !force) {
      stopAudio();
      return;
    }
    if (isSpeaking && force) {
      stopAudio();
    }
    const text = preprocessForTTS(rawText);
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang || language }),
      });
      const data = await res.json();
      if (data.source === 'chunks' && data.chunks?.length > 0) {
        // Sequential playback with natural pause between sentence chunks
        const playChunks = async (chunks) => {
          setIsSpeaking(true);
          for (let i = 0; i < chunks.length; i++) {
            if (!audioRef.current && i > 0) break; // stopped externally
            const blob = new Blob([Uint8Array.from(atob(chunks[i]), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
            const audio = new Audio(URL.createObjectURL(blob));
            audioRef.current = audio;
            await new Promise((resolve) => {
              audio.onended = resolve;
              audio.onerror = resolve;
              audio.play().catch(resolve);
            });
            if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 250));
          }
          setIsSpeaking(false);
          audioRef.current = null;
        };
        playChunks(data.chunks);
      } else if (data.source === 'polly' && data.audioData) {
        const blob = new Blob([Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        setIsSpeaking(true);
        audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
        audio.play();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = data.browserLang || 'hi-IN';
        utt.rate = 0.88; utt.pitch = 0.82;
        // Use pre-loaded voices (handles async voiceschanged); fallback for unsupported langs
        const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
        const lp = utt.lang.split('-')[0];
        // For English, prefer Indian English voices (en-IN) — sounds far more natural
        const v = language === 'en'
          ? (voices.find(v => v.lang === 'en-IN' && /ravi|veena|heera|aditi|sundar/i.test(v.name))
            || voices.find(v => v.lang === 'en-IN')
            || voices.find(v => v.lang.startsWith('en') && /india/i.test(v.name))
            || voices.find(v => v.lang === utt.lang))
          : (voices.find(v => v.lang === utt.lang && v.name.toLowerCase().includes('male'))
            || voices.find(v => v.lang.startsWith(lp) && v.name.toLowerCase().includes('male'))
            || voices.find(v => v.lang === utt.lang)
            || voices.find(v => v.lang.startsWith(lp)));
        // Only set a voice if we found one for the target language.
        // Don't fall back to Hindi/English — reading kn/ta/te text with a wrong voice sounds garbled.
        if (v) utt.voice = v;
        utt.onstart = () => setIsSpeaking(true);
        utt.onend = utt.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utt);
      }
    } catch {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = { hi:'hi-IN', kn:'kn-IN', ta:'ta-IN', te:'te-IN', en:'en-IN' }[language] || 'hi-IN';
        u.pitch = 0.82; u.rate = 0.88;
        window.speechSynthesis.speak(u);
      }
    }
  }, [language, isSpeaking]);

  // Keep speakTextRef in sync so the welcome effect can call it without stale closures
  useEffect(() => { speakTextRef.current = speakText; }, [speakText]);

  const segmentResponse = (text) => {
    if (text.split(/\s+/).length <= 180) return [text];
    const paras = text.split(/\n\n+/);
    const chunks = []; let cur = '';
    for (const p of paras) {
      const combined = cur ? cur + '\n\n' + p : p;
      if (combined.split(/\s+/).length > 180 && cur) { chunks.push(cur.trim()); cur = p; }
      else cur = combined;
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.length > 1 ? chunks : [text];
  };

  const sendMessage = async (text, forceLang, isVoice = false) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    stopAudio();
    lastInputWasVoiceRef.current = isVoice;
    const effectiveLang = forceLang || language;
    setHasStarted(true);
    setInputText('');

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages(prev => [...prev.filter(m => m.id !== 'welcome'), userMsg]);
    setIsLoading(true);
    const newHistory = [...conversationHistory, { role: 'user', content: trimmed }];

    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, language: effectiveLang }),
        signal: controller.signal,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed');

      const aiData = result.data;
      // Always trust user's explicitly selected language — don't auto-switch based on AI detection
      const detectedLang = effectiveLang;

      const segments = segmentResponse(aiData.message);
      const baseId = Date.now() + 1;
      const partLabel = (UI_STRINGS[detectedLang] || UI_STRINGS.en).partLabel;

      setMessages(prev => [...prev, ...segments.map((seg, i) => ({
        id: baseId + i, role: 'assistant',
        content: seg,
        displayText: segments.length > 1 ? `*(${partLabel} ${i+1}/${segments.length})*\n\n${seg}` : seg,
        language: detectedLang, timestamp: Date.now() + i,
      }))]);

      const updatedHistory = [...newHistory, { role: 'assistant', content: aiData.message }];
      setConversationHistory(updatedHistory);

      if (sessionIdRef.current) {
        fetch('/api/session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current, language: detectedLang, messages: updatedHistory.slice(-20), profile: aiData.extracted_profile || {} }),
        }).catch(() => {});
      }

      if (aiData.matched_scheme_ids !== undefined) {
        const schemes = (aiData.matched_scheme_ids || []).map(id => allSchemes.find(s => s.id === id)).filter(Boolean);
        if (schemes.length > 0) setMatchedSchemes(schemes);
      }

      if (aiData.message) {
        setTimeout(() => speakTextRef.current?.(aiData.message, detectedLang, true), 600);
      }
    } catch (error) {
      if (error.name === 'AbortError') return; // Language switched — discard stale response
      const s = UI_STRINGS[effectiveLang] || UI_STRINGS.en;
      const isNet = !navigator.onLine || error.message?.includes('fetch');
      const isAws = error.message?.toLowerCase().includes('aws') || error.message?.toLowerCase().includes('bedrock');
      const errText = isNet ? s.networkError : isAws ? s.awsError : s.error;
      setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', content: errText, displayText: errText, language: effectiveLang, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (sessionIdRef.current) {
      fetch(`/api/session?sessionId=${sessionIdRef.current}`, { method: 'DELETE' }).catch(() => {});
      sessionIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    setMessages([]); setConversationHistory([]); setMatchedSchemes([]);
    setHasStarted(false); setInputText('');
    stopAudio();
    setVoiceResetKey(k => k + 1);
  };

  return (
    <>
      {/* ── Full-screen language picker ── */}
      <AnimatePresence>
        {showLangPicker && <LanguagePicker onSelect={handlePickLanguage} />}
      </AnimatePresence>

      {/* ── Chat UI ── */}
      <motion.div
        className="h-screen mesh-subtle flex flex-col overflow-hidden"
        animate={{ opacity: showLangPicker ? 0 : 1, scale: showLangPicker ? 0.98 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: showLangPicker ? 'none' : 'auto' }}
      >
        {/* Header */}
        <header className="flex-shrink-0 relative z-20 glass-frost px-5 py-4">
          {/* Indian flag tricolor accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] tricolor-bar opacity-40" />
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: logo + app name */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-bharat-green/30 to-emerald-600/20 border border-bharat-green/25 flex items-center justify-center text-lg">🏛️</div>
              <div>
                <span className="font-black text-white text-base tracking-tight">Yojna-Setu</span>
                <span className="hidden sm:inline text-gray-600 text-xs ml-2">{strings.appName}</span>
              </div>
            </div>

            {/* Right: change language + help + reset */}
            <div className="flex items-center gap-2">
              {/* Language dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowLangDropdown(v => !v)}
                  whileTap={{ scale: 0.93 }}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border transition-all duration-200 ${
                    showLangDropdown
                      ? 'text-white border-bharat-green/50 bg-bharat-green/10'
                      : 'text-gray-300 hover:text-white glass border-bharat-green/25 hover:border-bharat-green/40'
                  }`}>
                  <Languages size={13} className="text-bharat-green flex-shrink-0" />
                  <span>{LANGUAGES.find(l => l.code === language)?.name}</span>
                  <motion.svg
                    animate={{ rotate: showLangDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    width={10} height={10} viewBox="0 0 10 10" className="text-gray-500 flex-shrink-0">
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {showLangDropdown && (
                    <>
                      {/* Click-away overlay */}
                      <div className="fixed inset-0 z-30" onClick={() => setShowLangDropdown(false)} />
                      <motion.div
                        className="absolute right-0 top-full mt-2 z-40 glass-frost border border-white/[0.1] rounded-2xl p-1.5 shadow-float min-w-[160px]"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}>
                        {LANGUAGES.map((lang, i) => (
                          <motion.button
                            key={lang.code}
                            onClick={() => {
                              setShowLangDropdown(false);
                              if (lang.code !== language) handleLanguageChange(lang.code);
                            }}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                              language === lang.code
                                ? 'bg-bharat-green/15 text-white border border-bharat-green/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                            }`}>
                            <span className="font-semibold">{lang.name}</span>
                            <span className="text-xs text-gray-600">{lang.greeting}</span>
                            {language === lang.code && (
                              <span className="w-1.5 h-1.5 rounded-full bg-bharat-green flex-shrink-0" />
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <motion.button onClick={() => setShowHelp(v => !v)} whileTap={{ scale: 0.93 }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-bharat-green glass border border-white/[0.07] px-3 py-2 rounded-xl transition-colors font-medium">
                <HelpCircle size={13} />
                <span className="hidden sm:inline">{strings.helpTitle}</span>
              </motion.button>

              <motion.button onClick={handleReset} whileTap={{ scale: 0.93 }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white glass border border-white/[0.07] px-3 py-2 rounded-xl transition-colors">
                <RefreshCw size={13} />
                <span className="hidden sm:inline">{strings.reset}</span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Offline banner */}
        <AnimatePresence>
          {isOffline && (
            <motion.div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5"
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="max-w-2xl mx-auto flex items-center gap-2 text-amber-400 text-xs">
                <WifiOff size={11} /><span>{strings.offline}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content — two columns on desktop */}
        <div className="flex-1 overflow-hidden flex w-full max-w-7xl mx-auto px-4 py-3 gap-4">

          {/* Left: Chat column */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-5 pb-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} onSpeak={speakText} isSpeaking={isSpeaking} />
                ))}
              </AnimatePresence>

              {/* Mobile-only: inline schemes (hidden on lg+) */}
              <AnimatePresence>
                {matchedSchemes.length > 0 && hasStarted && (
                  <div className="lg:hidden">
                    <SchemesSection
                      key="schemes-mobile"
                      schemes={matchedSchemes}
                      language={language}
                      label={strings.schemesFound}
                    />
                  </div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isLoading && <TypingIndicator key="typing" waitTime={strings.waitTime} />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Sample prompts */}
            <AnimatePresence>
              {!hasStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.3, ease: [0.25,1,0.5,1] }}
                >
                  <SamplePrompts language={language} onSelect={(text, lang) => sendMessage(text, lang)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="flex-shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-center py-1">
                <VoiceButton
                  language={language}
                  onTranscript={t => sendMessage(t, null, true)}
                  onListeningChange={v => {
                    setIsListening(v);
                    if (v) { stopAudio(); }
                  }}
                  disabled={isLoading}
                  resetKey={voiceResetKey}
                />
              </div>

              <div className="flex items-end gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 focus-within:border-bharat-green/35 focus-within:bg-white/[0.06] transition-all duration-200 shadow-inner">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
                  placeholder={strings.placeholder}
                  disabled={isLoading || isListening}
                  rows={2}
                  className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-40 leading-relaxed"
                />
                <motion.button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                  whileTap={inputText.trim() && !isLoading ? { scale: 0.88 } : {}}
                  whileHover={inputText.trim() && !isLoading ? { scale: 1.08 } : {}}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-200 ${
                    inputText.trim() && !isLoading ? 'bg-bharat-green text-white shadow-glow-sm'
                    : isLoading ? 'bg-bharat-green/30 text-bharat-green cursor-not-allowed'
                    : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'}`}
                >
                  {isLoading
                    ? <motion.div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    : <Send size={15} />}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right: Help + Schemes panel (desktop only, lg+) */}
          <div className="hidden lg:flex w-80 xl:w-96 flex-col flex-shrink-0">
            <SchemesPanel
              schemes={matchedSchemes}
              language={language}
              label={strings.schemesFound}
            />
          </div>
        </div>
      </motion.div>

      {/* Language notice toast */}
      <AnimatePresence>
        {langNotice && (
          <motion.div
            className="fixed top-16 left-1/2 z-50 -translate-x-1/2 bg-bharat-green/90 backdrop-blur text-white text-xs px-4 py-2 rounded-full shadow-glow-green"
            initial={{ opacity: 0, y: -10, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            🌐 {langNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help modal */}
      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)} />
            <motion.div
              className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,340px)] bg-[#0d1a0d] border border-white/[0.1] rounded-2xl p-5 shadow-float"
              style={{ x: '-50%', y: '-50%' }}
              initial={{ opacity: 0, scale: 0.88, y: '-45%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%' }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HelpCircle size={15} className="text-bharat-green" />
                  <span className="text-white font-bold text-sm">{strings.helpTitle}</span>
                </div>
                <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-white transition-colors"><X size={15} /></button>
              </div>

              <div className="space-y-2.5 mb-4">
                {(strings.helpSteps || []).map((step, i) => (
                  <motion.div key={i} className="flex items-start gap-2.5 text-sm text-gray-300"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-bharat-green/15 border border-bharat-green/25 flex items-center justify-center text-bharat-green text-xs font-bold">{i+1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
