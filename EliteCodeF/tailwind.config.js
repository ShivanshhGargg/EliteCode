/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void: '#050508',
        surface: '#0c0c14',
        panel: '#11111a',
        'panel-hover': '#181825',
        cyan: {
          DEFAULT: '#00f0ff',
          dim: 'rgba(0,240,255,0.15)',
          glow: 'rgba(0,240,255,0.4)',
        },
        magenta: {
          DEFAULT: '#ff00a0',
          dim: 'rgba(255,0,160,0.15)',
          glow: 'rgba(255,0,160,0.4)',
        },
        violet: {
          DEFAULT: '#7b2dff',
          dim: 'rgba(123,45,255,0.15)',
          glow: 'rgba(123,45,255,0.4)',
        },
        neon: {
          green: '#00ff88',
          red: '#ff3366',
          orange: '#ffaa00',
          yellow: '#f0e800',
        },
        txt: {
          primary: '#e8e8f0',
          secondary: '#8b8ba7',
          muted: '#4a4a6a',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0,240,255,0.3), 0 0 60px rgba(0,240,255,0.1)',
        'neon-magenta': '0 0 20px rgba(255,0,160,0.3), 0 0 60px rgba(255,0,160,0.1)',
        'neon-violet': '0 0 20px rgba(123,45,255,0.3), 0 0 60px rgba(123,45,255,0.1)',
        'glow-sm': '0 0 10px rgba(0,240,255,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'typing': 'typing 1.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
