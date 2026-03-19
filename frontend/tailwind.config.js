/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        fission: {
          bg: "#0a0a0f",
          surface: "#12121a",
          border: "#1e1e2e",
          accent: "#00ff88",
          "accent-dim": "#00cc6a",
          warning: "#ff6b35",
          purple: "#a855f7",
          blue: "#3b82f6",
          pt: "#00ff88",
          yt: "#ff6b35",
          lp: "#a855f7",
        },
      },
      fontFamily: {
        display: ['"Space Mono"', "monospace"],
        body: ['"DM Sans"', "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 255, 136, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 255, 136, 0.25)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
