/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        'surface-2': "var(--color-surface-2)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        'primary-dim': "var(--color-primary-dim)",
        accent: "var(--color-accent)",
        'accent-dim': "var(--color-accent-dim)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'aurora-1': 'aurora-1 8s ease-in-out infinite',
        'aurora-2': 'aurora-2 10s ease-in-out infinite',
        'aurora-3': 'aurora-3 12s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.4s ease',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      }
    },
  },
  plugins: [],
}
