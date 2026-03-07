'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

const LANG_MAP = { hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', en: 'en-IN' };

// Waveform bar configs — different delays/heights per bar for organic look
const BARS = [
  { delay: 0,    minH: 20, maxH: 80 },
  { delay: 0.15, minH: 30, maxH: 100 },
  { delay: 0.3,  minH: 15, maxH: 70 },
  { delay: 0.1,  minH: 35, maxH: 95 },
  { delay: 0.25, minH: 20, maxH: 85 },
];

function WaveformBar({ delay, isActive }) {
  return (
    <motion.div
      className="w-1 rounded-full bg-white"
      animate={isActive ? {
        scaleY: [0.2, 1, 0.4, 0.9, 0.3, 0.8, 0.2],
        opacity: [0.7, 1, 0.8, 1, 0.7, 1, 0.7],
      } : { scaleY: 0.25, opacity: 0.5 }}
      transition={isActive ? {
        duration: 1.2,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      } : { duration: 0.3 }}
      style={{ height: 32, originY: 0.5 }}
    />
  );
}

// Expanding ring — one per ripple
function RippleRing({ delay, size, color }) {
  return (
    <motion.div
      className={`absolute rounded-full border ${color} pointer-events-none`}
      style={{ width: size, height: size, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
      animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

export default function VoiceButton({ language, onTranscript, onListeningChange, disabled, resetKey }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const session = useRef({ active: false, accumulated: '', recognition: null, ended: true });
  const interimRef = useRef('');
  const cbRef = useRef({ onTranscript, onListeningChange });
  const langRef = useRef(language);

  useEffect(() => { cbRef.current = { onTranscript, onListeningChange }; }, [onTranscript, onListeningChange]);
  useEffect(() => { langRef.current = language; }, [language]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    }
  }, []);

  useEffect(() => {
    if (session.current.active) {
      session.current.active = false;
      try { session.current.recognition?.abort(); } catch (_) {}
      session.current.accumulated = '';
      interimRef.current = '';
      setIsListening(false);
      cbRef.current.onListeningChange?.(false);
      setTranscript('');
    }
  }, [resetKey]);

  function finalize() {
    const text = session.current.accumulated.trim();
    if (text) {
      setIsProcessing(true);
      cbRef.current.onTranscript?.(text);
      setTranscript('');
      session.current.accumulated = '';
      interimRef.current = '';
      setTimeout(() => setIsProcessing(false), 1500);
    }
  }

  function startSession() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !session.current.active) return;

    const r = new SR();
    r.lang = LANG_MAP[langRef.current] || 'en-IN';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    session.current.ended = false;
    interimRef.current = '';

    r.onstart = () => {
      setIsListening(true);
      cbRef.current.onListeningChange?.(true);
    };

    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) session.current.accumulated += t + ' ';
        else interim += t;
      }
      interimRef.current = interim;
      setTranscript((session.current.accumulated + interim).trim());
    };

    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        session.current.active = false;
        setIsListening(false);
        cbRef.current.onListeningChange?.(false);
      }
    };

    r.onend = () => {
      session.current.ended = true;
      const pending = interimRef.current.trim();
      if (pending) {
        session.current.accumulated += pending + ' ';
        interimRef.current = '';
        setTranscript(session.current.accumulated.trim());
      }
      if (session.current.active) {
        setTimeout(() => { if (session.current.active) startSession(); }, 300);
      } else {
        setIsListening(false);
        cbRef.current.onListeningChange?.(false);
        finalize();
      }
    };

    session.current.recognition = r;
    try { r.start(); } catch (err) {
      setTimeout(() => { if (session.current.active) startSession(); }, 500);
    }
  }

  const handleClick = () => {
    if (disabled) return;
    if (session.current.active) {
      session.current.active = false;
      setIsListening(false);
      cbRef.current.onListeningChange?.(false);
      if (session.current.ended) {
        finalize();
      } else {
        try { session.current.recognition?.stop(); } catch (_) {}
      }
    } else {
      session.current.accumulated = '';
      interimRef.current = '';
      setTranscript('');
      setIsProcessing(false);
      session.current.active = true;
      startSession();
    }
  };

  if (!supported) {
    return (
      <div className="text-center">
        <div className="text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
          ⚠️ Voice input requires Chrome browser. Please use Chrome for the best experience.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* ── Button cluster ── */}
      <div className="relative flex items-center justify-center">

        {/* Expanding ripple rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <RippleRing delay={0}    size={96} color="border-red-500/50" />
              <RippleRing delay={0.6}  size={96} color="border-red-500/30" />
              <RippleRing delay={1.2}  size={96} color="border-red-500/15" />
            </>
          )}
        </AnimatePresence>

        {/* Outer glow halo — breathing while listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute rounded-full bg-red-500/10"
              style={{ width: 120, height: 120, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* Main mic button */}
        <motion.button
          onClick={handleClick}
          disabled={disabled}
          // Tactile press feedback: 1 → 0.93 → 1
          whileTap={disabled ? {} : { scale: 0.93 }}
          // Breathing pulse while listening
          animate={isListening
            ? { scale: [1, 1.06, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
            : { scale: 1 }
          }
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`
            relative z-10 w-24 h-24 rounded-full flex items-center justify-center
            shadow-2xl outline-none
            ${disabled
              ? 'bg-gray-700 cursor-not-allowed opacity-50'
              : isListening
                ? 'bg-red-500 shadow-red-500/50'
                : 'bg-bharat-green shadow-bharat-green/50'
            }
          `}
          style={{
            boxShadow: isListening
              ? '0 0 0 0 rgba(239,68,68,0), 0 20px 40px rgba(239,68,68,0.4)'
              : '0 0 0 0 rgba(124,179,66,0), 0 20px 40px rgba(124,179,66,0.35)',
          }}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {/* Processing shimmer overlay */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                className="absolute inset-0 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Icon / Waveform */}
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="wave"
                className="flex items-center gap-0.5 h-8"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              >
                {BARS.map((bar, i) => (
                  <WaveformBar key={i} delay={bar.delay} isActive={isListening} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
                transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              >
                <Mic size={36} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Status label */}
      <AnimatePresence mode="wait">
        {isListening ? (
          <motion.p
            key="listening"
            className="text-red-400 text-sm font-medium"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            🔴 Listening… tap to stop
          </motion.p>
        ) : isProcessing ? (
          <motion.p
            key="processing"
            className="text-bharat-green text-sm font-medium"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [1, 0.5, 1], y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          >
            ✨ Processing…
          </motion.p>
        ) : (
          <motion.p
            key="idle"
            className="text-gray-400 text-sm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {disabled ? 'Processing...' : 'Tap to speak'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Live transcript preview */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            className="w-full max-w-sm bg-bharat-card/80 border border-bharat-border rounded-xl p-3"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          >
            <p className="text-gray-300 text-sm italic">"{transcript}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
