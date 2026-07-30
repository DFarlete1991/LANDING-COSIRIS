/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Basado en variables CSS (ver :root en index.css) en vez de hex fijo,
        // para poder tematizar el perfil público de cada inmobiliaria con su
        // color_hex sin perder el soporte de opacidad (bg-primary/10, etc.) —
        // ver src/lib/color.ts (agencyThemeStyle).
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          hover:   'rgb(var(--color-primary-hover-rgb) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        foreground: '#0F172A',
        background: '#FFFFFF',
        border: '#E5E1DB',
        ink: {
          DEFAULT: '#0F172A',
          muted:   '#667085',
          faint:   '#D0CCC5',
        },
        surface: '#F8F7F5',
        card: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],
        'heading-1': ['42px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'heading-2': ['36px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.015em' }],
        'heading-3': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-4': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,.04)',
        'card': '0 8px 30px rgba(0,0,0,.05)',
        'elevated': '0 12px 40px rgba(0,0,0,.07)',
      },
      borderRadius: {
        'card': '22px',
        'input': '12px',
      },
      spacing: {
        18:  '4.5rem',
        22:  '5.5rem',
      },
      maxWidth: {
        'content': '1200px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19,1,0.22,1)',
      },
      keyframes: {
        'float-blob': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.95)' },
        },
      },
      animation: {
        'float-blob': 'float-blob 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

