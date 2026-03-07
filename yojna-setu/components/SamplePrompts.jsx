'use client';

const SAMPLES = [
  {
    lang: 'hi',
    text: 'मैं राजस्थान से हूँ, किसान हूँ, BPL कार्ड है, 3 बच्चे हैं',
    label: 'Hindi - Farmer',
  },
  {
    lang: 'kn',
    text: 'ನಾನು ಕರ್ನಾಟಕದ ರೈತ, ನನ್ನ ಹೆಂಡತಿ ವಿಧವೆ, ವಯಸ್ಸು 45',
    label: 'Kannada - Farmer',
  },
  {
    lang: 'ta',
    text: 'நான் தமிழ்நாட்டில் இருக்கிறேன், கர்ப்பிணி, BPL குடும்பம்',
    label: 'Tamil - Pregnant',
  },
  {
    lang: 'te',
    text: 'నేను ఆంధ్రప్రదేశ్ నుండి, వీధి వ్యాపారి, చిన్న వ్యాపారం చేస్తాను',
    label: 'Telugu - Vendor',
  },
  {
    lang: 'en',
    text: "I'm a widow from Bihar, 65 years old, have BPL card and no income",
    label: 'English - Widow',
  },
  {
    lang: 'en',
    text: "I'm a student from SC community, family income is below 2 lakhs, studying in Class 11",
    label: 'English - Student',
  },
];

export default function SamplePrompts({ onSelect, language }) {
  const display = SAMPLES.filter(s => s.lang === language);

  return (
    <div>
      <p className="text-gray-500 text-xs mb-2 text-center">Try these examples:</p>
      <div className="flex flex-col gap-2">
        {display.map((sample, i) => (
          <button
            key={i}
            onClick={() => onSelect(sample.text, sample.lang)}
            className="text-left bg-bharat-card hover:bg-bharat-muted/30 border border-bharat-border hover:border-bharat-green/30 rounded-xl p-3 transition-all duration-200 group"
          >
            <div className="flex items-start gap-2">
              <span className="text-bharat-green text-xs mt-0.5 flex-shrink-0 font-mono">→</span>
              <div>
                <p className="text-gray-300 text-sm group-hover:text-white transition-colors leading-relaxed">
                  {sample.text}
                </p>
                <p className="text-gray-600 text-xs mt-1">{sample.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
