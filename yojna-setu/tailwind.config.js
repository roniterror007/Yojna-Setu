/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bharat: {
          green:     "#6FCF60",
          darkgreen: "#4CAF50",
          bg:        "#050810",
          card:      "#0C1220",
          surface:   "#111827",
          border:    "#1a2540",
          glow:      "#6FCF60",
          muted:     "#1e2d45",
          saffron:   "#FF9933",
          flaggreen: "#138808",
          chakra:    "#000080",
        },
      },
      backgroundImage: {
        'mesh-green':  'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(111,207,96,0.18) 0%, transparent 60%)',
        'mesh-bottom': 'radial-gradient(ellipse 60% 40% at 80% 110%, rgba(111,207,96,0.08) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow-green': '0 0 30px rgba(111,207,96,0.25), 0 0 60px rgba(111,207,96,0.08)',
        'glow-sm':    '0 0 12px rgba(111,207,96,0.2)',
        'card':       '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
        'float':      '0 20px 60px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
      },
      animation: {
        pulse2:      "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        wave:        "wave 1.2s linear infinite",
        ripple:      "ripple 1.5s linear infinite",
        "spin-slow": "spin 3s linear infinite",
        shimmer:     "shimmer 2.2s linear infinite",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.5)" },
          "50%":      { transform: "scaleY(1.5)" },
        },
        ripple: {
          "0%":   { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(111,207,96,0.2)" },
          "50%":      { boxShadow: "0 0 40px rgba(111,207,96,0.45)" },
        },
      },
      fontFamily: {
        devanagari: ["Noto Sans Devanagari", "sans-serif"],
        kannada:    ["Noto Sans Kannada", "sans-serif"],
        tamil:      ["Noto Sans Tamil", "sans-serif"],
        telugu:     ["Noto Sans Telugu", "sans-serif"],
      },
    },
  },
  plugins: [],
};
