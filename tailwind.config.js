/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        fono: ['"Space Mono"', 'ui-monospace', 'monospace'],
        code: ['Menlo', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: { DEFAULT: '#7ce5e8', border: '#67d9dd', dark: '#145c62', ink: '#102426', soft: '#eefcfc' },
        ink: { DEFAULT: '#111315', 2: '#3e4345', 3: '#73787a', 4: '#969a9c' },
        line: '#e2e3e3',
      },
    },
  },
  plugins: [],
}
