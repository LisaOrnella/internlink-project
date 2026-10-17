import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef2f9', 100: '#d5dff0', 200: '#a9bde0', 300: '#7d9bd0', 400: '#4a6fb3', 500: '#2b4d8f', 600: '#1c3a75', 700: '#12295a', 800: '#0b1c42', 900: '#07132e', 950: '#040b1c' },
        teal: { 50: '#e8faf6', 100: '#c5f3e8', 200: '#93e6d3', 300: '#5bd3bb', 400: '#2dbda1', 500: '#14a589', 600: '#0d8571', 700: '#0d6a5b', 800: '#0f544a', 900: '#0f453d' },
        sun: { 50: '#fff8eb', 100: '#ffecc6', 200: '#ffd88a', 300: '#ffc14d', 400: '#ffab24', 500: '#f98d07', 600: '#dd6802' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(7,19,46,.04), 0 8px 24px -8px rgba(7,19,46,.12)',
        lift: '0 2px 4px rgba(7,19,46,.06), 0 16px 40px -12px rgba(7,19,46,.22)',
      },
      keyframes: { shimmer: { '100%': { transform: 'translateX(100%)' } } },
    },
  },
  plugins: [],
};
export default config;
