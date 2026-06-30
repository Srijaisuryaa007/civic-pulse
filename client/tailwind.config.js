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
        sans: ['Outfit', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Override Tailwind defaults with larger, more legible scale
        'xs':   ['0.8125rem',  { lineHeight: '1.5',  letterSpacing: '0.01em' }],   // 13px
        'sm':   ['0.9375rem',  { lineHeight: '1.6',  letterSpacing: '0.005em' }],  // 15px
        'base': ['1.0625rem',  { lineHeight: '1.65', letterSpacing: '0.003em' }],  // 17px
        'lg':   ['1.1875rem',  { lineHeight: '1.6',  letterSpacing: '0' }],        // 19px
        'xl':   ['1.3125rem',  { lineHeight: '1.5',  letterSpacing: '-0.01em' }],  // 21px
        '2xl':  ['1.5625rem',  { lineHeight: '1.4',  letterSpacing: '-0.015em' }], // 25px
        '3xl':  ['1.9375rem',  { lineHeight: '1.3',  letterSpacing: '-0.02em' }],  // 31px
        '4xl':  ['2.375rem',   { lineHeight: '1.2',  letterSpacing: '-0.025em' }], // 38px
        '5xl':  ['3rem',       { lineHeight: '1.1',  letterSpacing: '-0.03em' }],  // 48px
        '6xl':  ['3.75rem',    { lineHeight: '1.05', letterSpacing: '-0.035em' }], // 60px
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
