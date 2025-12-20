/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          surface: "var(--color-surface)",
          main: "var(--color-text-main)",
          muted: "var(--color-text-muted)",
          accent: "var(--color-accent)",
          "accent-soft": "var(--color-accent-soft)",
          border: "var(--color-border)",
        },
      },
      fontFamily: {
        // High-end editorial serif for headings
        display: ["Playfair Display", "serif"],
        // Clean, readable sans for UI and body
        sans: ["Source Sans Pro", "Inter", "sans-serif"],
        // Geometric for buttons/nav
        mono: ["Montserrat", "sans-serif"],
      },
      borderRadius: {
        'pro': '2px', // Minimalist sharp corners
      },
    },
  },
  plugins: [],
};