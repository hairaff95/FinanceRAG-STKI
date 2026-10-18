/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          bg: "#0e0e10",
          surface: "#18181b",
          yellow: "#F8C646",
          purple: "#6C5CE7",
          red: "#EB4D4B",
          blue: "#9BD2FD",
          green: "#C8E087",
          pink: "#FF7675",
          white: "#FFFFFF",
          cream: "#F4F1EA",
          dark: "#000000",
        },
      },
      fontFamily: {
        display: ["Anton", "sans-serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'Space Grotesk'", "monospace"],
      },
      boxShadow: {
        neo: "4px 4px 0px #000000",
        "neo-lg": "6px 6px 0px #000000",
        "neo-sm": "2px 2px 0px #000000",
        "neo-white": "4px 4px 0px #ffffff",
      },
      borderRadius: {
        "neo-xl": "1.25rem",
        "neo-2xl": "1.75rem",
        "neo-3xl": "2.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
