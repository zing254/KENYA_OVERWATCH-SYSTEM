/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kenya: {
          red: '#BB0000',
          green: '#006600',
          black: '#000000',
          white: '#FFFFFF',
        },
        earth: {
          gold: '#D4A853',
          soil: '#8B4513',
          sunset: '#FF6B35',
          sand: '#F5DEB3',
          clay: '#A0522D',
        },
        urban: {
          charcoal: '#1F2937',
          concrete: '#6B7280',
          slate: '#374151',
          ash: '#9CA3AF',
        },
        government: {
          navy: '#1E3A5F',
          official: '#2D5016',
          authority: '#7F1D1D',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#BB0000',
          600: '#991b1b',
          700: '#7f1d1d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#BB0000',
          600: '#991b1b',
          700: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        display: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
