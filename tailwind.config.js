/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8000',
          hover:   '#E67300',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        foreground: '#0F172A',
        background: '#FFFFFF',
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#FF8000',
        accent: '#F8FAFC',
        'accent-foreground': '#0F172A',
        'destructive': '#DC2626',
        'destructive-foreground': '#FFFFFF',
        surface:    '#FAFAFA',
        ink: {
          DEFAULT: '#0F172A',
          muted:   '#64748B',
          faint:   '#CBD5E1',
        },
        dot: '#D1D5DB',
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18:  '4.5rem',
        22:  '5.5rem',
        '4xl': '56rem',
        '5xl': '64rem',
      },
      letterSpacing: {
        tightest: '-0.05em',
      },
      maxWidth: {
        prose: '65ch',
        'hero-copy': '46rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19,1,0.22,1)',
      },
    },
  },
  plugins: [],
}

