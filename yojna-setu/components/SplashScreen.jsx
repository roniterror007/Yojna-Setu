'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TITLE = 'Yojna-Setu'.split('');
const LANGS = ['हिंदी', 'ಕನ್ನಡ', 'தமிழ்', 'తెలుగు', 'English'];

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);
  // Store in ref so parent re-renders don't reset our timers
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 550);
    const t3 = setTimeout(() => setPhase(3), 1050);
    const t4 = setTimeout(() => setPhase(4), 2000);
    const t5 = setTimeout(() => setPhase(5), 2450);
    const t6 = setTimeout(() => onCompleteRef.current?.(), 3700);
    return () => [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: '#050810' }}
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
      }}
    >
      {/* Ambient radial glow — grows slowly */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 2 }}
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(111,207,96,0.14) 0%, rgba(111,207,96,0.05) 45%, transparent 70%)',
        }}
      />

      {/* Second, offset glow for depth */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 0.6 : 0 }}
        transition={{ duration: 1.6 }}
        style={{
          background:
            'radial-gradient(ellipse 40% 35% at 60% 40%, rgba(111,207,96,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Outer pulsing halo ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ border: '1px solid rgba(111,207,96,0.12)' }}
        initial={{ width: 180, height: 180, opacity: 0 }}
        animate={
          phase >= 2
            ? {
                width: [180, 480, 180],
                height: [180, 480, 180],
                opacity: [0, 0.6, 0],
              }
            : { width: 180, height: 180, opacity: 0 }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Middle ring — static glow border */}
      <motion.div
        className="absolute rounded-full"
        style={{ border: '1px solid rgba(111,207,96,0.18)' }}
        initial={{ width: 220, height: 220, opacity: 0, scale: 0.6 }}
        animate={
          phase >= 2
            ? { width: 220, height: 220, opacity: 1, scale: 1 }
            : {}
        }
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      />

      {/* Inner tight ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ border: '1px solid rgba(111,207,96,0.28)', width: 140, height: 140 }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, scale: phase >= 2 ? 1 : 0.4 }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
      />

      {/* Corner accent dots */}
      {phase >= 4 &&
        [
          { top: '22%', left: '18%' },
          { top: '22%', right: '18%' },
          { bottom: '22%', left: '18%' },
          { bottom: '22%', right: '18%' },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ ...pos, background: 'rgba(111,207,96,0.35)' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          />
        ))}

      {/* ── Central content ── */}
      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 px-6">

        {/* Logo icon */}
        <motion.div
          className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, rgba(111,207,96,0.22) 0%, rgba(52,168,83,0.12) 100%)',
            border: '1px solid rgba(111,207,96,0.35)',
            boxShadow: '0 0 50px rgba(111,207,96,0.3), 0 0 100px rgba(111,207,96,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          initial={{ scale: 0.1, opacity: 0, filter: 'blur(28px)' }}
          animate={phase >= 2 ? { scale: 1, opacity: 1, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <motion.span
            className="text-5xl select-none"
            animate={phase >= 2 ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🏛️
          </motion.span>
          {/* Icon inner glow */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.06) 0%, transparent 60%)' }}
          />
        </motion.div>

        {/* Title — letter-by-letter cascade */}
        <div className="flex items-end overflow-visible select-none" style={{ gap: '0.02em' }}>
          {TITLE.map((char, i) => (
            <motion.span
              key={i}
              className="font-black leading-none"
              style={{
                fontSize: 'clamp(52px, 11vw, 88px)',
                letterSpacing: '-0.02em',
                display: 'inline-block',
                background: 'linear-gradient(100deg, #FF9933 0%, #ffb347 20%, #ffffff 42%, #ffffff 58%, #4CAF50 80%, #138808 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              initial={{ opacity: 0, y: 36, filter: 'blur(12px)', scale: 0.9 }}
              animate={phase >= 3 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
              transition={{
                delay: i * 0.048,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          className="text-gray-400 text-sm sm:text-base font-medium tracking-[0.28em] uppercase"
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 10, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          Your Voice &nbsp;·&nbsp; Your Rights
        </motion.p>

        {/* Language strip */}
        <motion.div
          className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 4 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {LANGS.map((lang, i) => (
            <motion.span
              key={lang}
              className="text-gray-700 text-xs sm:text-sm"
              initial={{ opacity: 0, y: 6 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.075, duration: 0.4 }}
            >
              {lang}
              {i < LANGS.length - 1 && (
                <span className="text-gray-800 ml-2 sm:ml-3">·</span>
              )}
            </motion.span>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-44 sm:w-56 h-[2px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 5 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(111,207,96,0.45) 0%, #6FCF60 100%)',
            }}
            initial={{ width: '0%' }}
            animate={phase >= 5 ? { width: '100%' } : {}}
            transition={{ duration: 1.15, ease: [0.25, 1, 0.5, 1] }}
          />
        </motion.div>
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(111,207,96,1) 1px, transparent 1px), linear-gradient(90deg, rgba(111,207,96,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </motion.div>
  );
}
