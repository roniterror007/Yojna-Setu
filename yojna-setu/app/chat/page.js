'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RefreshCw, ArrowLeft, Volume2, VolumeX, Sparkles, Info, MessageSquare } from 'lucide-react';
import LanguageSelector from '../../components/LanguageSelector';
import VoiceButton from '../../components/VoiceButton';
import SchemeCard from '../../components/SchemeCard';
import SamplePrompts from '../../components/SamplePrompts';
import { allSchemes } from '../../lib/schemes';

const UI_STRINGS = {
  hi: {
    placeholder: 'अपनी स्थिति बताएं... (राज्य, काम, परिवार)',
    matched: 'आपके लिए योजनाएँ',
    noMatch: 'अभी कोई योजना नहीं',
    reset: 'नई बातचीत',
    schemeCount: 'योजनाएँ',
    welcome: 'नमस्ते! मैं योजना-सेतु हूँ 🙏\n\nबस अपनी स्थिति बताएं — राज्य, काम, परिवार — और मैं आपके लिए सरकारी योजनाएँ खोजूँगा।',
  },
  kn: {
    placeholder: 'ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ ಹೇಳಿ...',
    matched: 'ನಿಮಗೆ ಸೂಕ್ತ ಯೋಜನೆಗಳು',
    noMatch: 'ಇನ್ನೂ ಯೋಜನೆಗಳಿಲ್ಲ',
    reset: 'ಹೊಸ ಸಂಭಾಷಣೆ',
    schemeCount: 'ಯೋಜನೆಗಳು',
    welcome: 'ನಮಸ್ಕಾರ! ನಾನು ಯೋಜನ-ಸೇತು 🙏\n\nನಿಮ್ಮ ರಾಜ್ಯ, ವೃತ್ತಿ, ಕುಟುಂಬದ ಬಗ್ಗೆ ತಿಳಿಸಿ.',
  },
  ta: {
    placeholder: 'உங்கள் நிலையை சொல்லுங்கள்...',
    matched: 'உங்களுக்கு பொருத்தமான திட்டங்கள்',
    noMatch: 'இன்னும் திட்டங்கள் இல்லை',
    reset: 'புதிய உரையாடல்',
    schemeCount: 'திட்டங்கள்',
    welcome: 'வணக்கம்! நான் யோஜனா-சேது 🙏\n\nஉங்கள் மாநிலம், தொழில், குடும்பம் பற்றி சொல்லுங்கள்.',
  },
  te: {
    placeholder: 'మీ పరిస్థితి చెప్పండి...',
    matched: 'మీకు సరిపడ పథకాలు',
    noMatch: 'ఇంకా పథకాలు లేవు',
    reset: 'కొత్త సంభాషణ',
    schemeCount: 'పథకాలు',
    welcome: 'నమస్కారం! నేను యోజన-సేతు 🙏\n\nమీ రాష్ట్రం, వృత్తి, కుటుంబం గురించి చెప్పండి.',
  },
  en: {
    placeholder: 'Describe yourself — state, occupation, family...',
    matched: 'Schemes matched for you',
    noMatch: 'No schemes yet',
    reset: 'New Chat',
    schemeCount: 'Schemes',
    welcome: "Hello! I'm Yojna-Setu 🙏\n\nTell me about yourself — your state, what you do, your family — and I'll find every government scheme you qualify for.",
  },
};

// Render inline bold (**text**) within a single text segment
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Full markdown renderer: handles bullets, numbered lists, blank lines, bold
function renderMessage(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line → spacing
    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Bullet point: lines starting with •, -, or *
    if (/^[•\-\*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[•\-\*]\s/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="text-bharat-green mt-0.5 flex-shrink-0 text-sm leading-none">•</span>
          <span className="text-gray-200 text-sm leading-relaxed">{renderInline(content)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list: 1. 2. etc.
    const numMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="text-bharat-green/70 text-xs font-mono flex-shrink-0 w-4 mt-0.5">{numMatch[1]}.</span>
          <span className="text-gray-200 text-sm leading-relaxed">{renderInline(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // Regular paragraph line
    elements.push(
      <p key={i} className="text-gray-200 text-sm leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
}

function MessageBubble({ message, onSpeak, isSpeaking }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end group`}
      initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      {/* Avatar — pops in slightly after the bubble */}
      <motion.div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 shadow-lg
          ${isUser
            ? 'bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/25'
            : 'bg-gradient-to-br from-bharat-green/25 to-emerald-600/20 border border-bharat-green/25'
          }`}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.12, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {isUser ? '👤' : '🏛️'}
      </motion.div>

      <div className={`max-w-[78%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg
          ${isUser
            ? 'bg-gradient-to-br from-blue-600/25 to-indigo-700/20 border border-blue-500/20 text-gray-100 rounded-br-md'
            : 'glass-card text-gray-200 rounded-bl-md'
          }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {renderMessage(message.displayText || message.content)}
            </div>
          )}
        </div>

        {/* Actions row */}
        <div className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isUser ? 'flex-row-reverse' : ''}`}>
          {!isUser && onSpeak && message.displayText && (
            <button
              onClick={() => onSpeak(message.displayText, message.language)}
              className={`flex items-center gap-1 text-xs transition-colors rounded-full px-2 py-0.5
                ${isSpeaking ? 'text-bharat-green bg-bharat-green/10' : 'text-gray-600 hover:text-bharat-green'}`}
            >
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

function TypingIndicator() {
  return (
    <motion.div
      className="flex gap-3 items-end"
      initial={{ opacity: 0, y: 16, scale: 0.95, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 8, scale: 0.95, filter: 'blur(4px)', transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      {/* Avatar */}
      <motion.div
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-bharat-green/25 to-emerald-600/20 border border-bharat-green/25 flex items-center justify-center text-sm shadow-lg"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
      >
        🏛️
      </motion.div>

      {/* Bubble */}
      <div className="glass-card rounded-2xl rounded-bl-md px-5 py-4">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block rounded-full bg-bharat-green"
              style={{ width: 8, height: 8 }}
              animate={{
                y:       [0, -9, 0],
                scale:   [1, 1.25, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration:   0.7,
                repeat:     Infinity,
                delay:      i * 0.18,
                ease:       'easeInOut',
                repeatType: 'loop',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [language, setLanguage] = useState('hi');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [voiceResetKey, setVoiceResetKey] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const strings = UI_STRINGS[language] || UI_STRINGS.en;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!hasStarted) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: strings.welcome,
        displayText: strings.welcome,
        language,
        timestamp: Date.now(),
      }]);
    }
  }, [language]);

  const speakText = useCallback(async (text, lang) => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      audioRef.current = null;
      setIsSpeaking(false);
      return;
    }
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang || language }),
      });
      const data = await res.json();

      if (data.source === 'polly' && data.audioData) {
        const audioBlob = new Blob([Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audioRef.current = audio;
        setIsSpeaking(true);
        audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
        audio.play();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = data.browserLang || 'hi-IN';
        utterance.rate = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === utterance.lang) || voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        if (voice) utterance.voice = voice;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : language === 'ta' ? 'ta-IN' : language === 'te' ? 'te-IN' : 'en-IN';
        window.speechSynthesis.speak(u);
      }
    }
  }, [language, isSpeaking]);

  const sendMessage = async (text, forceLang) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const effectiveLang = forceLang || language;
    setHasStarted(true);
    setInputText('');

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages(prev => [...prev.filter(m => m.id !== 'welcome'), userMsg]);
    setIsLoading(true);

    const newHistory = [...conversationHistory, { role: 'user', content: trimmed }];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, language: effectiveLang }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed');

      const aiData = result.data;
      const detectedLang = language;

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiData.message,
        displayText: aiData.message,
        language: detectedLang,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiData.message }]);

      if (aiData.matched_scheme_ids?.length > 0) {
        const schemes = aiData.matched_scheme_ids.map(id => allSchemes.find(s => s.id === id)).filter(Boolean);
        setMatchedSchemes(schemes);
        setActiveTab('schemes');
        setTimeout(() => setActiveTab('chat'), 1500);
      }

      if (aiData.message) setTimeout(() => speakText(aiData.message, detectedLang), 600);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        displayText: 'Sorry, something went wrong. Please try again.',
        language: effectiveLang, timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setConversationHistory([]);
    setMatchedSchemes([]);
    setHasStarted(false);
    setInputText('');
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    audioRef.current = null;
    setIsSpeaking(false);
    setActiveTab('chat');
    setVoiceResetKey(k => k + 1);
  };

  return (
    <div className="h-screen mesh-subtle flex flex-col overflow-hidden page-enter">

      {/* ── Header ── */}
      <header className="flex-shrink-0 glass-frost border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.push('/')}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Home</span>
            </motion.button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-bharat-green/30 to-emerald-600/20 border border-bharat-green/25 flex items-center justify-center text-lg shadow-glow-sm">
                🏛️
              </div>
              <div>
                <span className="font-bold text-white text-base tracking-tight">Yojna-Setu</span>
                <span className="hidden sm:inline text-gray-600 text-xs ml-2">AI Scheme Assistant</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-bharat-green bg-bharat-green/8 border border-bharat-green/20 px-2.5 py-1 rounded-full">
              <Sparkles size={9} /> Nova Pro + AWS
            </span>
            <motion.button
              onClick={handleReset}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white glass px-3 py-1.5 rounded-lg transition-colors hover:border-white/15"
            >
              <RefreshCw size={11} />
              <span className="hidden sm:inline">{strings.reset}</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Language Selector ── */}
      <div className="flex-shrink-0 border-b border-white/[0.05] px-4 py-2.5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <LanguageSelector selected={language} onChange={setLanguage} />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-hidden max-w-6xl w-full mx-auto flex gap-0 lg:gap-5 px-4 py-4">

        {/* LEFT: Chat */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile tab switcher */}
          <div className="lg:hidden flex mb-3 glass-frost rounded-xl p-1">
            {[
              { id: 'chat', label: 'Chat', icon: <MessageSquare size={13} /> },
              { id: 'schemes', label: 'Schemes', icon: '🏆', badge: matchedSchemes.length },
            ].map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-bharat-green text-white shadow-glow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {typeof tab.icon === 'string' ? tab.icon : tab.icon}
                {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-white text-bharat-green text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Chat messages area */}
          <div
            className={`flex-1 overflow-y-auto space-y-4 pr-1 mb-3 ${activeTab === 'schemes' ? 'hidden lg:block' : ''}`}
            style={{ scrollbarWidth: 'thin' }}
          >
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} onSpeak={speakText} isSpeaking={isSpeaking} />
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {isLoading && <TypingIndicator key="typing" />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Sample prompts */}
          {!hasStarted && activeTab === 'chat' && (
            <motion.div
              className="mb-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            >
              <SamplePrompts
                onSelect={(text, lang) => { setLanguage(lang); setTimeout(() => sendMessage(text, lang), 50); }}
                language={language}
              />
            </motion.div>
          )}

          {/* Input area */}
          <div className={`flex-shrink-0 ${activeTab === 'schemes' ? 'hidden lg:flex' : 'flex'} flex-col gap-3`}>

            {/* Voice button row */}
            <div className="flex items-center justify-center py-2">
              <VoiceButton
                language={language}
                onTranscript={t => sendMessage(t)}
                onListeningChange={(v) => {
                  setIsListening(v);
                  if (v) {
                    window.speechSynthesis?.cancel();
                    audioRef.current?.pause();
                    audioRef.current = null;
                    setIsSpeaking(false);
                  }
                }}
                disabled={isLoading}
                resetKey={voiceResetKey}
              />
            </div>

            {/* Text input row */}
            <div className="input-glow flex items-end gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 hover:border-white/[0.18] transition-colors duration-200">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
                placeholder={strings.placeholder}
                disabled={isLoading || isListening}
                rows={2}
                className={`flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500
                  resize-none focus:outline-none disabled:opacity-40 leading-relaxed lang-${language}`}
              />
              <motion.button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                whileTap={!inputText.trim() || isLoading ? {} : { scale: 0.88 }}
                whileHover={inputText.trim() && !isLoading ? { scale: 1.06 } : {}}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-200 ${
                  inputText.trim() && !isLoading
                    ? 'bg-bharat-green text-white shadow-glow-sm'
                    : isLoading
                    ? 'bg-bharat-green/30 text-bharat-green cursor-not-allowed'
                    : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <motion.div
                    className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <Send size={14} />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* RIGHT: Schemes Panel */}
        <div className={`
          lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden
          ${activeTab === 'schemes' ? 'flex' : 'hidden lg:flex'}
        `} style={{ scrollbarWidth: 'none' }}>

          {/* Schemes header */}
          <div className="glass-frost rounded-2xl p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/20 flex items-center justify-center text-lg">
                  🏆
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {matchedSchemes.length > 0 ? strings.matched : strings.noMatch}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {matchedSchemes.length > 0 ? `${matchedSchemes.length} ${strings.schemeCount}` : 'Describe yourself to find schemes'}
                  </p>
                </div>
              </div>
              {matchedSchemes.length > 0 && (
                <div className="w-7 h-7 rounded-full bg-bharat-green text-white text-xs font-bold flex items-center justify-center shadow-glow-sm">
                  {matchedSchemes.length}
                </div>
              )}
            </div>
          </div>

          {/* Matched scheme cards */}
          {matchedSchemes.length > 0 ? (
            matchedSchemes.map((scheme, i) => (
              <motion.div
                key={scheme.id}
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 280, damping: 28, delay: i * 0.08 }}
              >
                <SchemeCard scheme={scheme} language={language} index={i} />
              </motion.div>
            ))
          ) : (
            <div className="glass-card rounded-2xl p-5">
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest mb-4">Popular Schemes</p>
              <div className="space-y-2">
                {allSchemes.slice(0, 5).map((s, i) => (
                  <motion.div
                    key={s.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-default"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                  >
                    <span className="text-xl flex-shrink-0">
                      {s.category === 'agriculture' ? '🌾' : s.category === 'health' ? '🏥' : s.category === 'housing' ? '🏠' : s.category === 'pension' ? '👴' : s.category === 'employment' ? '⚒️' : '✅'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{s.name}</p>
                      <p className="text-gray-600 text-xs">{s.benefit.type === 'cash' || s.benefit.type === 'pension' ? `₹${s.benefit.amount?.toLocaleString('en-IN')}` : s.benefit.type}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex items-start gap-2 text-xs text-gray-700">
                  <Info size={11} className="flex-shrink-0 mt-0.5 text-bharat-green/60" />
                  <span>Speak or type to get AI-matched schemes for your profile</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="fixed bottom-5 right-5 z-50 glass-green text-bharat-green text-xs px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-glow-green"
            initial={{ opacity: 0, y: 16, scale: 0.88, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
            exit={{    opacity: 0, y: 10,  scale: 0.92, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <div className="flex items-end gap-0.5 h-3">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-bharat-green rounded-full"
                  animate={{ scaleY: [0.4, 1.2, 0.4] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                  style={{ height: '100%', transformOrigin: 'bottom' }}
                />
              ))}
            </div>
            Speaking...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
