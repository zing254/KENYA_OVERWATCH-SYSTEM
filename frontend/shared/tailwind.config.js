/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../shared/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ntsa: {
          primary: '#14532D',
          primaryLight: '#22C55E',
          primaryDark: '#0F2F1F',
          accent: '#BB0000',
          accentLight: '#DC2626',
          black: '#000000',
          white: '#FFFFFF',
        },
        kenya: {
          red: '#BB0000',
          green: '#006600',
          black: '#000000',
          white: '#FFFFFF',
        },
        ui: {
          bg: {
            light: '#F8FAFC',
            dark: '#111827',
            card: '#1F2937',
          },
          border: {
            light: '#E5E7EB',
            dark: '#374151',
          },
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'ntsa': '0 4px 6px -1px rgba(20, 83, 45, 0.3), 0 2px 4px -1px rgba(20, 83, 45, 0.2)',
        'ntsa-lg': '0 10px 15px -3px rgba(20, 83, 45, 0.4), 0 4px 6px -2px rgba(20, 83, 45, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #22C55E, 0 0 10px #22C55E' },
          '100%': { boxShadow: '0 0 10px #22C55E, 0 0 20px #22C55E' },
        },
      },
    },
  },
  plugins: [],
}
