/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0a0a0a',
          panel: '#111111',
          border: '#27272a',
          ember: '#ff6b35',
          ai: '#3b82f6',
          plugin: '#10b981',
          doc: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
