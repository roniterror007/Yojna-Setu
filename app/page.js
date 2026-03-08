'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mic, ChevronDown } from 'lucide-react';
import SplashScreen from '../components/SplashScreen';

const LANGUAGE_CYCLE = [
  { text: 'योजना-सेतु', lang: 'Hindi',   sub: 'आपकी आवाज़, आपके अधिकार' },
  { text: 'ಯೋಜನ-ಸೇತು', lang: 'Kannada', sub: 'ನಿಮ್ಮ ಧ್ವನಿ, ನಿಮ್ಮ ಹಕ್ಕುಗಳು' },
  { text: 'யோஜனா-சேது', lang: 'Tamil',   sub: 'உங்கள் குரல், உங்கள் உரிமைகள்' },
  { text: 'యోజన-సేతు', lang: 'Telugu',  sub: 'మీ స్వరం, మీ హక్కులు' },
  { text: 'Yojna-Setu', lang: 'English', sub: 'Your Voice, Your Rights' },
];

const STATS = [
  { value: '₹1L Cr+', label: 'Unclaimed welfare annually',  color: 'text-red-400',         bg: 'from-red-500/10 to-red-500/5',    border: 'border-red-500/15' },
  { value: '350M',    label: 'Rural Indians underserved',   color: 'text-amber-400',        bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/15' },
  { value: '1500+',   label: 'Govt schemes available',      color: 'text-bharat-green',     bg: 'from-bharat-green/10 to-bharat-green/5', border: 'border-bharat-green/15' },
  { value: '5',       label: 'Indian languages supported',  color: 'text-blue-400',         bg: 'from-blue-500/10 to-blue-500/5',  border: 'border-blue-500/15' },
];

const FEATURES = [
  { icon: '🎤', title: 'Voice First',         desc: 'Speak naturally in your dialect. No typing, no forms, no literacy barrier.',                            color: 'from-red-500/10 to-red-500/5',     border: 'border-red-500/15' },
  { icon: '🧠', title: 'AI Matching',         desc: 'Nova Pro AI understands your full situation and finds every scheme you qualify for',                       color: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/15' },
  { icon: '🌐', title: 'True Multilingual',   desc: 'Hindi, Kannada, Tamil, Telugu, English. Native language understanding, not just translation.',          color: 'from-blue-500/10 to-blue-500/5',   border: 'border-blue-500/15' },
  { icon: '🔊', title: 'Audio Responses',     desc: 'Hears your situation in your language, replies in your language with Polly TTS',                         color: 'from-cyan-500/10 to-cyan-500/5',   border: 'border-cyan-500/15' },
  { icon: '📋', title: 'End-to-End Guidance', desc: 'Not just discovery. Exact documents needed, how to apply, where to go.',                                  color: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/15' },
  { icon: '⚡', title: 'Instant Access',       desc: '24/7 available, no agents, no queues. Your rights, directly in your hands.',                             color: 'from-bharat-green/10 to-bharat-green/5', border: 'border-bharat-green/15' },
];

const STEPS = [
  { icon: '🎤', label: 'Speak',      desc: 'Tell your situation in your language' },
  { icon: '👂', label: 'AI Listens', desc: 'Understands context, extracts profile' },
  { icon: '🎯', label: 'Matches',    desc: 'Finds all schemes you qualify for' },
  { icon: '🔊', label: 'Responds',   desc: 'Explains in your language with audio' },
  { icon: '✅', label: 'Apply',      desc: 'Get exact steps to unlock benefits' },
];

const SAMPLE_QUERIES = [
  { lang: '🇮🇳 Hindi',   text: '"मैं राजस्थान से हूँ, किसान हूँ, BPL कार्ड है"', result: 'PM-KISAN ₹6,000 + 3 more schemes' },
  { lang: '🏔️ Kannada', text: '"ನಾನು ವಿಧವೆ, ವಯಸ್ಸು 55, BPL"',                   result: 'Widow Pension + Ayushman Bharat' },
  { lang: '🌴 Tamil',    text: '"நான் கர்ப்பிணி, BPL குடும்பம்"',               result: 'PMMVY ₹5,000 + 2 more' },
  { lang: '⭐ Telugu',   text: '"నేను వీధి వ్యాపారి"',                            result: 'PM SVANidhi ₹50,000 loan' },
];

// Scroll-triggered fade-in with blur (premium feel)
function FadeIn({ children, delay = 0, y = 28, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      animate={inView
        ? { opacity: 1, y: 0, filter: 'blur(0px)' }
        : { opacity: 0, y,   filter: 'blur(6px)' }
      }
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <FadeIn className="text-center mb-12 lg:mb-16">
      <div className="inline-flex items-center gap-2 bg-bharat-green/8 border border-bharat-green/20 rounded-full px-4 py-1 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-bharat-green" />
        <span className="text-bharat-green text-xs font-semibold uppercase tracking-widest">{eyebrow}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">{title}</h2>
    </FadeIn>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [langIdx, setLangIdx] = useState(0);
  const [visible, setVisible] = useState(true);
const [scrolled, setScrolled] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const handleNavigate = () => {
    setIsLeaving(true);
    setTimeout(() => router.push('/chat'), 320);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setLangIdx(i => (i + 1) % LANGUAGE_CYCLE.length); setVisible(true); }, 320);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const current = LANGUAGE_CYCLE[langIdx];

  return (
    <>
    <AnimatePresence>
      {showSplash && <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />}
    </AnimatePresence>
    <motion.div
      className="min-h-screen bg-bharat-bg text-white overflow-x-hidden"
      animate={{
        opacity: isLeaving ? 0 : 1,
        scale: showSplash ? 0.984 : 1,
      }}
      transition={{
        opacity: { duration: 0.25, ease: 'easeInOut' },
        scale: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      }}
    >

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'glass-frost border-b border-white/[0.06] shadow-2xl shadow-black/50' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-bharat-green/30 to-emerald-600/20 border border-bharat-green/25 flex items-center justify-center text-lg">
              🏛️
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Yojna-Setu</span>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">

        {/* Subtle grid overlay — blobs come from the global DynamicGlow layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-[0.022]" style={{
            backgroundImage: 'linear-gradient(rgba(111,207,96,1) 1px, transparent 1px), linear-gradient(90deg, rgba(111,207,96,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>


        {/* Badge */}
        <motion.div
          className="relative z-10 mb-8 inline-flex items-center gap-2 glass border border-white/10 rounded-full px-5 py-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
        >
          <span className="w-2 h-2 rounded-full bg-bharat-saffron animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-white/80" />
          <span className="w-2 h-2 rounded-full bg-bharat-flaggreen animate-pulse" />
          <span className="text-white/80 text-xs font-semibold tracking-wide">Voice-first · Multilingual · 5 Languages</span>
        </motion.div>

        {/* Animated title */}
        <motion.div
          className="relative z-10 text-center mb-8"
          style={{ minHeight: '180px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={langIdx}
              initial={{ opacity: 0, y: 24, filter: 'blur(12px)', scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  filter: 'blur(0px)',  scale: 1    }}
              exit={{    opacity: 0, y: -18, filter: 'blur(8px)',  scale: 1.01 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-3 hero-gradient-text leading-none pb-2">
                {current.text}
              </h1>
              <p className="text-gray-300 text-xl sm:text-2xl font-light">{current.sub}</p>
              <p className="text-bharat-green/50 text-sm mt-2 font-medium tracking-widest uppercase">{current.lang}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="relative z-10 text-center text-gray-500 text-lg sm:text-xl max-w-2xl leading-relaxed mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28, ease: [0.25, 1, 0.5, 1] }}
        >
          Voice-first AI that helps{' '}
          <span className="text-white font-semibold">every Indian citizen</span>{' '}
          discover government welfare schemes in their native language, instantly.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="relative z-10 flex flex-col sm:flex-row gap-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          <motion.button
            onClick={handleNavigate}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="group relative flex items-center gap-3 bg-bharat-green hover:bg-bharat-darkgreen text-white font-bold px-9 py-4 rounded-2xl text-lg transition-colors shadow-glow-green overflow-hidden"
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <Mic size={20} />
            Start Speaking
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <motion.button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex items-center gap-2 glass border border-white/10 text-gray-400 hover:text-white font-medium px-8 py-4 rounded-2xl text-lg transition-colors"
          >
            How it works <ChevronDown size={18} />
          </motion.button>
        </motion.div>

        {/* Stats grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-4 text-center backdrop-blur-sm cursor-default`}
              initial={{ opacity: 0, y: 24, scale: 0.95, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.55, delay: 0.52 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.04 }}
            >
              <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-xs mt-1 leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} className="text-gray-700" />
        </motion.div>
      </section>

      {/* ── The Problem ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeading eyebrow="The Problem" title="India's Welfare Paradox" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: '🏛️', num: '₹2.7L Cr', desc: 'Government allocates annually for welfare schemes', color: 'from-bharat-green/12 to-bharat-green/4', border: 'border-bharat-green/15' },
              { icon: '📉', num: '40–60%',    desc: 'Actually reaches beneficiaries. Rest is unclaimed.', color: 'from-red-500/12 to-red-500/4',         border: 'border-red-500/20' },
              { icon: '❓', num: 'Why?',      desc: "Language barriers, digital illiteracy, no awareness. People don't know they qualify.", color: 'from-amber-500/12 to-amber-500/4', border: 'border-amber-500/20' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.12} y={32}>
                <motion.div
                  className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-3xl p-8 text-center h-full`}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <p className="text-white text-4xl font-black mb-3">{item.num}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-bharat-green/3 via-transparent to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <SectionHeading eyebrow="How It Works" title="5 Steps to Unlock Your Benefits" />
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 relative">
            <div className="hidden sm:block absolute top-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-bharat-green/30 to-transparent" />
            {STEPS.map((step, i) => (
              <FadeIn key={i} delay={i * 0.11} y={24} className="flex-1">
                <div className="flex flex-col items-center text-center relative z-10 h-full">
                  <motion.div
                    className="w-20 h-20 rounded-2xl glass-frost flex items-center justify-center text-3xl mb-4 shadow-float"
                    whileHover={{ scale: 1.1, y: -4 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                  >
                    {step.icon}
                  </motion.div>
                  <span className="text-bharat-green text-xs font-bold uppercase tracking-widest mb-1">{step.label}</span>
                  <p className="text-gray-600 text-xs leading-relaxed max-w-[110px]">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample Conversations ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionHeading eyebrow="See It In Action" title="Real Conversations, Real Benefits" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SAMPLE_QUERIES.map((q, i) => (
              <FadeIn key={i} delay={i * 0.1} y={24}>
                <motion.div
                  className="glass-card rounded-2xl p-6 h-full"
                  whileHover={{ y: -5, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                >
                  <div className="inline-flex items-center gap-1.5 bg-bharat-green/8 border border-bharat-green/15 rounded-full px-3 py-1 mb-4">
                    <span className="text-bharat-green text-xs font-semibold">{q.lang}</span>
                  </div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                    <p className="text-gray-300 text-sm italic leading-relaxed">{q.text}</p>
                  </div>
                  <div className="flex items-center gap-3 pl-1 pt-3 border-t border-white/[0.06]">
                    <div className="w-7 h-7 rounded-full bg-bharat-green/15 border border-bharat-green/20 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                    <p className="text-bharat-green text-sm font-semibold">{q.result}</p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-bharat-green/2 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <SectionHeading eyebrow="Features" title="Built Different" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.07} y={24}>
                <motion.div
                  className={`h-full bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6`}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="text-white font-bold text-base mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Languages ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <SectionHeading eyebrow="Languages" title="Bharat Speaks Many Tongues" />
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { flag: '🇮🇳', lang: 'Hindi',   native: 'हिंदी',  speakers: '600M speakers' },
              { flag: '🏔️', lang: 'Kannada', native: 'ಕನ್ನಡ', speakers: '45M speakers' },
              { flag: '🌴', lang: 'Tamil',   native: 'தமிழ்', speakers: '75M speakers' },
              { flag: '⭐', lang: 'Telugu',  native: 'తెలుగు', speakers: '85M speakers' },
              { flag: '🔤', lang: 'English', native: 'English', speakers: 'Fallback' },
            ].map((l, i) => (
              <FadeIn key={i} delay={i * 0.09} y={20}>
                <motion.div
                  className="glass-frost rounded-2xl px-6 py-5 text-center min-w-[120px]"
                  whileHover={{ scale: 1.08, y: -5 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                >
                  <div className="text-3xl mb-2">{l.flag}</div>
                  <div className="text-white font-bold text-lg">{l.native}</div>
                  <div className="text-gray-700 text-xs mt-0.5">{l.speakers}</div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bharat-green/6 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-bharat-green/8 rounded-full blur-[100px]" />
        </div>
        <FadeIn y={32} className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight">
            Your rights are<br />
            <span className="hero-gradient-text text-shine">waiting for you.</span>
          </h2>
          <p className="text-gray-500 text-lg sm:text-xl mb-12">
            Speak in your language. Get what you deserve.
          </p>
          <motion.button
            onClick={handleNavigate}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="group relative inline-flex items-center gap-3 bg-bharat-green hover:bg-bharat-darkgreen text-white font-bold px-12 py-5 rounded-2xl text-xl transition-colors shadow-glow-green overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <Mic size={24} />
            Start Now
            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
          </motion.button>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-bharat-green/20 border border-bharat-green/20 flex items-center justify-center text-sm">🏛️</div>
            <span className="text-gray-600 text-sm">Yojna-Setu · Team NON-NEGOTIATORS</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-700">
            <span>Multilingual · Voice-first</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>5 Indian Languages</span>
          </div>
        </div>
      </footer>
    </motion.div>
    </>
  );
}
