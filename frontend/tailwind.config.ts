import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        calm: {
          50: '#f7f5f0',
          100: '#eee9de',
          200: '#ddd3bd',
          300: '#c3b394',
          400: '#a8926f',
        },
        sage: {
          50: '#f2f6f3',
          100: '#e1ebe3',
          200: '#c3d7c8',
          300: '#9cbba4',
          400: '#749d7e',
          500: '#557f60',
          600: '#43654c',
        },
        dusk: {
          50: '#f2f5f9',
          100: '#e2e9f2',
          200: '#c5d3e5',
          300: '#9fb4d0',
          400: '#7690b6',
          500: '#57729c',
          600: '#455b7e',
          700: '#394a66',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
