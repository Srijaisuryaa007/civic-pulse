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
        paper: '#F9F8F4',      // Alabaster / Rice Paper
        forest: '#2D3A31',     // Deep Forest Green
        sage: '#8C9A84',       // Sage Green
        clay: '#DCCFC2',       // Mushroom / Soft Clay
        stone: '#E6E2DA',      // Stone border
        terracotta: '#C27B66', // Terracotta Accent
        
        // Brand mappings to preserve compatibility with existing classes
        brand: {
          50: '#F9F8F4',
          100: '#E6E2DA',
          200: '#DCCFC2',
          300: '#8C9A84',
          400: '#8C9A84',
          500: '#2D3A31', // Deep forest is the brand primary
          600: '#2D3A31',
          700: '#2D3A31',
          800: '#2D3A31',
          900: '#2D3A31',
        },
        severity: {
          minor: '#8C9A84',
          moderate: '#DCCFC2',
          critical: '#C27B66',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Sans 3"', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['"Source Sans 3"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '24px', // 24px is standard rounded-3xl
        '4xl': '40px',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgba(45, 58, 49, 0.05)',
        'soft-md': '0 10px 15px -3px rgba(45, 58, 49, 0.05)',
        'soft-lg': '0 20px 40px -10px rgba(45, 58, 49, 0.05)',
        'soft-xl': '0 25px 50px -12px rgba(45, 58, 49, 0.15)',
      }
    },
  },
  plugins: [],
}
