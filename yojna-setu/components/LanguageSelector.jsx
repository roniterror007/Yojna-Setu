'use client';
import { motion } from 'framer-motion';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi',   native: 'हिंदी',    flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ',   flag: '🏔️' },
  { code: 'ta', name: 'Tamil',   native: 'தமிழ்',   flag: '🌴' },
  { code: 'te', name: 'Telugu',  native: 'తెలుగు',  flag: '⭐' },
  { code: 'en', name: 'English', native: 'English',  flag: '🔤' },
];

export default function LanguageSelector({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {LANGUAGES.map((lang) => {
        const isActive = selected === lang.code;
        return (
          <motion.button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            // Tactile press
            whileTap={{ scale: 0.94 }}
            whileHover={!isActive ? { scale: 1.04 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              border overflow-hidden outline-none select-none
              transition-colors duration-200
              ${isActive
                ? 'text-white border-bharat-green'
                : 'bg-bharat-card text-gray-300 border-bharat-border hover:border-bharat-green/50 hover:text-white'
              }
            `}
          >
            {/* Animated active background — shared layoutId so it slides between pills */}
            {isActive && (
              <motion.div
                layoutId="lang-active-bg"
                className="absolute inset-0 bg-bharat-green rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}

            {/* Content — sits above the animated bg */}
            <span className="relative z-10 text-base">{lang.flag}</span>
            <span className="relative z-10">{lang.native}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export { LANGUAGES };
