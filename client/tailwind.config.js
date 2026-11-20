/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070a14',
        accent: '#8b5cf6',
        cyan: '#22d3ee',
        ok: '#34d399',
        warn: '#fbbf24',
        danger: '#f87171',
        mist: '#8b93b3',
        line: 'rgba(255, 255, 255, 0.08)',
        'line-strong': 'rgba(255, 255, 255, 0.14)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      keyframes: {
        shimmer: { to: { backgroundPosition: '250% 0' } },
        'shimmer-bg': { to: { backgroundPosition: '-200% 0' } },
        'pulse-dot': {
          '0%': { boxShadow: '0 0 0 0 rgba(52, 211, 153, 0.6)' },
          '70%': { boxShadow: '0 0 0 10px rgba(52, 211, 153, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(52, 211, 153, 0)' }
        },
        glow: { to: { boxShadow: '0 0 22px rgba(34, 211, 238, 0.25)' } }
      },
      animation: {
        shimmer: 'shimmer 7s linear infinite',
        'shimmer-bg': 'shimmer-bg 1.4s linear infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
        glow: 'glow 1.6s infinite alternate'
      }
    }
  },
  plugins: []
};