/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cinema Noir - Deep, sophisticated palette
        cinema: {
          // Deep blacks and charcoals (background)
          void: '#08080A',
          black: '#0D0D0F',
          darker: '#121216',
          dark: '#1A1A1F',
          // Warm slate surfaces
          surface: '#22222A',
          elevated: '#2A2A34',
          border: '#35353F',
          // Muted text
          muted: '#6B6B78',
          subtle: '#8B8B98',
        },
        // Amber/Gold accent - projector light warmth
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Rose/Burgundy - dramatic accent
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },
        // Warm cream for light mode
        cream: {
          50: '#FDFCFB',
          100: '#FAF7F2',
          200: '#F5F0E8',
          300: '#E8E0D5',
          400: '#D4C9BC',
        },
        // Legacy primary (now cinema-accent)
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        accent: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        }
      },
      fontFamily: {
        // Display font - elegant, cinematic
        display: ['Playfair Display', 'Georgia', 'serif'],
        // Body font - clean, modern
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        // Mono for code/technical
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-lg': '0 0 40px rgba(245, 158, 11, 0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'cinema': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'film-grain': 'filmGrain 0.5s steps(10) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.25)' },
        },
        filmGrain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-1%, -1%)' },
          '20%': { transform: 'translate(1%, 1%)' },
          '30%': { transform: 'translate(-1%, 1%)' },
          '40%': { transform: 'translate(1%, -1%)' },
          '50%': { transform: 'translate(-1%, 0%)' },
          '60%': { transform: 'translate(1%, 0%)' },
          '70%': { transform: 'translate(0%, 1%)' },
          '80%': { transform: 'translate(0%, -1%)' },
          '90%': { transform: 'translate(1%, 1%)' },
        },
      },
      transitionTimingFunction: {
        'cinema': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    }
  },
  plugins: []
}
