/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Segoe UI", "sans-serif"],
        mono: ["SF Mono", "JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        spatial: {
          bg: "#08080F",
          surface: "#0F0F1E",
          border: "rgba(255,255,255,0.08)",
          accent: "#4A90D9",
          purple: "#8B5CF6",
          pink: "#EC4899",
          green: "#10B981",
          amber: "#F59E0B",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(74,144,217,0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(74,144,217,0.8), 0 0 40px rgba(74,144,217,0.4)" },
        },
      },
    },
  },
  plugins: [],
};
