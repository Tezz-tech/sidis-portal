/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1F2937',
        graphite: '#4B5563',
        pencil: '#9AA3AF',
        rule: '#E3E6EA',
        sheet: '#F6F7F9',
        paper: '#FFFFFF',
        marker: {
          DEFAULT: '#F26B21',
          deep: '#C45012',
          wash: '#FEF1E9',
        },
        pass: '#0F7B5F',
        fail: '#B42318',

        // Marketing-site palette (Landing/Pricing/RequestWorkspace only) —
        // additive, deliberately separate from the ink/paper tokens above so
        // the staff dashboard and exam-taking flow are untouched.
        void: '#08080D',
        voidsoft: '#131320',
        mist: '#F6F4FF',
        violet: { DEFAULT: '#7C5CFC', deep: '#5B3DF0', soft: '#EDE9FF' },
        cyan: '#22D3EE',
        lime: '#D3FF5C',
        coral: '#FF6B5E',
      },
      fontFamily: {
        display: ['"Archivo Expanded"', 'Archivo', 'sans-serif'],
        head: ['Archivo', 'sans-serif'],
        sans: ['"Public Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        // Marketing-site fonts (see palette note above).
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['30px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'section-head': ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'card-title': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        small: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['11px', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
        timer: ['22px', { lineHeight: '1.2', fontWeight: '500' }],
      },
      borderRadius: {
        card: '6px',
        chip: '4px',
      },
      boxShadow: {
        float: '0 1px 2px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.08)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        entrance: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        micro: '120ms',
        standard: '200ms',
        entrance: '320ms',
      },
      spacing: {
        18: '4.5rem',
      },
      maxWidth: {
        admin: '1280px',
        exam: '720px',
      },
    },
  },
  plugins: [],
};
