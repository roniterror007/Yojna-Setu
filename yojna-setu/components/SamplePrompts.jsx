'use client';
import { motion } from 'framer-motion';

const SAMPLES = {
  hi: [
    { text: 'मैं UP का किसान हूँ, 2 एकड़ ज़मीन है, BPL कार्ड है', icon: '🌾' },
    { text: 'मेरी माँ 68 साल की विधवा हैं, कोई आय नहीं है', icon: '👴' },
    { text: 'मैं गर्भवती हूँ, पहला बच्चा, राजस्थान से हूँ', icon: '👶' },
    { text: 'मेरी बेटी है, पढ़ाई के लिए पैसे नहीं, SC परिवार', icon: '📚' },
    { text: 'छोटा व्यापार शुरू करना है, ₹50,000 चाहिए', icon: '🏪' },
    { text: 'मनरेगा में काम चाहिए, गाँव में रहता हूँ', icon: '⚒️' },
  ],
  kn: [
    { text: 'ನಾನು ಕರ್ನಾಟಕದ ರೈತ, 3 ಎಕರೆ ಜಮೀನು ಇದೆ', icon: '🌾' },
    { text: 'ನನ್ನ ತಾಯಿ ವಿಧವೆ, 65 ವರ್ಷ, BPL ಕಾರ್ಡ್ ಇದೆ', icon: '👴' },
    { text: 'ನಾನು ಗರ್ಭಿಣಿ, ಮೊದಲ ಮಗು, ಆಸ್ಪತ್ರೆ ಖರ್ಚು ಬೇಕು', icon: '👶' },
    { text: 'ನನ್ನ ಮಗಳಿಗೆ ವಿದ್ಯಾರ್ಥಿ ವೇತನ ಬೇಕು, SC ಕುಟುಂಬ', icon: '📚' },
    { text: 'ಸಣ್ಣ ವ್ಯಾಪಾರ ಶುರು ಮಾಡಲು ಸಾಲ ಬೇಕು', icon: '🏪' },
    { text: 'ಉಜ್ವಲ ಯೋಜನೆ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ ಬೇಕು', icon: '🔥' },
  ],
  ta: [
    { text: 'நான் தமிழ்நாட்டு விவசாயி, 2 ஏக்கர் நிலம் உள்ளது', icon: '🌾' },
    { text: 'என் அம்மா விதவை, 67 வயது, வருமானமில்லை', icon: '👴' },
    { text: 'நான் கர்ப்பிணி, BPL குடும்பம், முதல் குழந்தை', icon: '👶' },
    { text: 'என் மகளுக்கு உதவித்தொகை வேண்டும், SC சமூகம்', icon: '📚' },
    { text: 'சிறு தொழில் தொடங்க கடன் வேண்டும்', icon: '🏪' },
    { text: 'வீட்டு உதவி வேண்டும், கிராமத்தில் வசிக்கிறேன்', icon: '🏠' },
  ],
  te: [
    { text: 'నేను ఆంధ్రప్రదేశ్ రైతును, 2 ఎకరాల భూమి ఉంది', icon: '🌾' },
    { text: 'మా అమ్మ వితంతువు, 66 సంవత్సరాలు, ఆదాయం లేదు', icon: '👴' },
    { text: 'నేను గర్భవతిని, మొదటి బిడ్డ, BPL కుటుంబం', icon: '👶' },
    { text: 'నా కూతురికి స్కాలర్‌షిప్ కావాలి, SC కుటుంబం', icon: '📚' },
    { text: 'చిన్న వ్యాపారం చేయాలని ఉంది, రుణం కావాలి', icon: '🏪' },
    { text: 'వీధి వ్యాపారిని, PM SVANidhi గురించి తెలుసుకోవాలి', icon: '🛒' },
  ],
  en: [
    { text: "I'm a farmer from Bihar, 2 acres land, BPL card", icon: '🌾' },
    { text: "My mother is a 65-year-old widow with no income", icon: '👴' },
    { text: "I'm pregnant, first child, need maternity benefits", icon: '👶' },
    { text: "SC student, family income below ₹2 lakh, need scholarship", icon: '📚' },
    { text: "Want to start a small business, need a loan", icon: '🏪' },
    { text: "Street vendor looking for PM SVANidhi loan", icon: '🛒' },
  ],
};

const LABEL = {
  hi: 'इनमें से कुछ आज़माएँ',
  kn: 'ಇವುಗಳಲ್ಲಿ ಒಂದನ್ನು ಪ್ರಯತ್ನಿಸಿ',
  ta: 'இவற்றில் ஒன்றை முயற்சிக்கவும்',
  te: 'వీటిలో ఒకటి ప్రయత్నించండి',
  en: 'Try one of these',
};

export default function SamplePrompts({ onSelect, language }) {
  const prompts = SAMPLES[language] || SAMPLES.en;
  const label = LABEL[language] || LABEL.en;

  return (
    <div className="w-full">
      <p className="text-gray-600 text-xs mb-3 text-center font-medium tracking-wide uppercase">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {prompts.map((sample, i) => (
          <motion.button
            key={i}
            onClick={() => onSelect(sample.text, language)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-start gap-3 text-left bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-bharat-green/30 rounded-xl px-3.5 py-3 transition-all duration-200 group"
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{sample.icon}</span>
            <span className="text-gray-400 group-hover:text-gray-200 text-sm leading-snug transition-colors">
              {sample.text}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
