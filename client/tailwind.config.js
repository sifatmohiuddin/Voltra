/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F8FA',
        panel: '#FFFFFF',
        line: '#E7E9EE',
        ink: {
          DEFAULT: '#14171F',
          muted: '#5B6270',
          faint: '#9AA0AE',
        },
        volt: {
          DEFAULT: '#FF5A1F',
          dim: '#E44E17',
          soft: '#FFEDE4',
        },
        circuit: {
          DEFAULT: '#3452FF',
          soft: '#EAEDFF',
        },
        stock: {
          in: '#17A673',
          low: '#E4A317',
          out: '#D8443C',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,23,31,0.04), 0 1px 12px rgba(20,23,31,0.04)',
        pop: '0 8px 30px rgba(20,23,31,0.10)',
      },
    },
  },
  plugins: [],
}
