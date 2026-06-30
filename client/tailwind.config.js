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
        
        // Editorial & Botanical mapped to Luxury Tokens
        paper: '#F9F8F6',        // Warm Alabaster
        forest: '#1A1A1A',       // Rich Charcoal
        sage: '#6C6863',         // Warm Grey
        terracotta: '#D4AF37',   // Metallic Gold
        clay: '#EBE5DE',         // Pale Taupe
        stone: '#EBE5DE',        // Pale Taupe
        
        // Explicit Editorial Palette
        alabaster: '#F9F8F6',
        charcoal: '#1A1A1A',
        taupe: '#EBE5DE',
        gold: '#D4AF37',
        warmgrey: '#6C6863',
        
        // Category Accents (Refined & Muted for Luxury feel)
        accent: {
          pothole: '#D4AF37',     // Gold
          streetlight: '#4A5568', // Slate Charcoal
          garbage: '#8C7B65',     // Warm Bronze
          water: '#5A6B7C',       // Muted Steel Blue
        },
        
        // Status Colors mapped for luxury editorial feel
        status: {
          reported: '#D4AF37', // Gold
          progress: '#6C6863', // Warm Grey
          resolved: '#1A1A1A', // Rich Charcoal
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
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
