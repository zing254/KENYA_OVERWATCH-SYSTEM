/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kenyan Flag Colors
        kenya: {
          red: '#BB0000',      // Deep red from flag
          green: '#006600',     // Forest green from flag
          black: '#000000',     // Black from flag
          white: '#FFFFFF',     // White from flag
        },
        // Earth Tones (Savannah, Soil)
        earth: {
          gold: '#D4A853',     // Savannah gold
          soil: '#8B4513',    // Soil brown
          sunset: '#FF6B35',   // Sunset orange
          sand: '#F5DEB3',     // Sand
          clay: '#A0522D',     // Clay
        },
        // Urban Nairobi Neutrals
        urban: {
          charcoal: '#1F2937',  // Charcoal
          concrete: '#6B7280',   // Concrete grey
          slate: '#374151',      // Dark slate
          ash: '#9CA3AF',       // Ash grey
        },
        // Government/Institutional
        government: {
          navy: '#1E3A5F',      // Deep navy
          official: '#2D5016',   // Official green
          authority: '#7F1D1D',  // Authority red
        },
        // Primary (Intelligence/Security feel)
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',      // Growth green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Accent (Alert/Warning)
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#BB0000',     // Kenyan red
          600: '#991b1b',
          700: '#7f1d1d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#BB0000',     // Kenyan red
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
