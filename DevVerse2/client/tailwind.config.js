/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-panel': 'var(--bg-panel)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          contrast: 'var(--on-accent)',
        },
        violet: {
          DEFAULT: 'var(--violet)',
          soft: 'var(--violet-soft)',
        },
        cyan: {
          DEFAULT: 'var(--cyan)',
          soft: 'var(--cyan-soft)',
        },
        coral: {
          DEFAULT: 'var(--coral)',
          soft: 'var(--coral-soft)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: 'var(--amber-soft)',
        },
        legend: '#f0c419',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      maxWidth: {
        wrap: 'var(--max-w)',
      },
      transitionTimingFunction: {
        dv: 'var(--ease)',
        'dv-soft': 'var(--ease-soft)',
      },
    },
  },
  plugins: [],
};
