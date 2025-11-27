/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // CarePlus Primary Colors
        primary: {
          50: '#E0F7F5',
          100: '#B3EDE8',
          200: '#80E2DA',
          300: '#4DD7CC',
          400: '#26D0C2',
          500: '#00C9B7',  // Main primary - CarePlus teal
          600: '#00B3A3',
          700: '#00A899',
          800: '#008C80',
          900: '#006B62',
        },
        // CarePlus Accent
        accent: {
          purple: '#9F7AEA',
          mint: '#00BFA5',
        },
        // Semantic colors
        success: '#00A8E8',
        warning: '#F59E0B',
        error: '#EF4444',
        // CarePlus System Colors
        careplus: {
          bg: '#FAFBFC',
          card: '#FFFFFF',
          border: '#E5E7EB',
          text: {
            primary: '#1F2937',
            secondary: '#6B7280',
            muted: '#9CA3AF',
          },
          sidebar: '#FFFFFF',
        },
        badge: {
          free: '#10B981',      // 자유 - green
          challenge: '#8B5CF6', // 챌린지 - purple
          survey: '#06B6D4',    // 설문조사 - cyan
          patient: '#F59E0B',   // 환우 - amber
          researcher: '#3B82F6', // 연구자 - blue
        }
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        lg: '10.25px',
        xl: '12px',
        '2xl': '16px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
