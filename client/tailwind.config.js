/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Keeping this for consistency, though we lock the design to light mode
  theme: {
    extend: {
      colors: {
        base: '#F7F6F2',
        surface: '#FFFFFF',
        inverted: '#141414',
        'inverted-surface': '#1F1F1F',
        border: 'rgba(20, 20, 20, 0.08)',
        'border-dark': 'rgba(247, 246, 242, 0.15)',
        muted: '#737373',
        
        // Category Accents
        accent: {
          pothole: '#EF4444',     // Warm Red
          streetlight: '#3B82F6', // Electric Blue
          garbage: '#F59E0B',     // Amber
          water: '#14B8A6',       // Teal
        },
        
        // Status Colors mapped for utility
        status: {
          reported: '#EAB308', // Yellow
          progress: '#3B82F6', // Blue
          resolved: '#22C55E', // Green
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderWidth: {
        hairline: '0.5px',
      },
      borderRadius: {
        DEFAULT: '14px',
        md: '14px',
        lg: '14px',
        xl: '14px',
        '2xl': '14px',
        '3xl': '14px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0, 0, 0.2, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      }
    },
  },
  plugins: [],
}
