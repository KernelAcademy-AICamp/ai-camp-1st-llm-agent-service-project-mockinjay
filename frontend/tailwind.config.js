/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /**
       * ========================================
       * COLOR SYSTEM
       * ========================================
       * WCAG AA Compliant Color Palette
       * - Primary: Mint/Teal (#00c9b7)
       * - Secondary: Purple (#9f7aea)
       * - Semantic colors for status indication
       * - Gray scale for neutral elements
       */
      colors: {
        // ===== Brand Colors (WCAG AA Compliant) =====
        primary: {
          50: '#e6faf8',    // Background tint
          100: '#ccf5f1',   // Very light
          200: '#99ebe3',   // Light
          300: '#66e0d5',   // Light accent
          400: '#33d6c7',   // Medium light
          500: '#00c9b7',   // Main brand color - Primary
          600: '#00b3a3',   // Hover state
          700: '#009d8f',   // Active/pressed
          800: '#00877a',   // Dark accent
          900: '#006156',   // Very dark
          950: '#004a42',   // Darkest
          DEFAULT: '#00c9b7',
          foreground: '#ffffff',
          // Interactive states
          light: '#e6faf8', // For soft backgrounds
          hover: '#00b3a3',
          pressed: '#009d8f',
        },

        secondary: {
          50: '#f5f3ff',    // Background tint
          100: '#ede9fe',   // Very light
          200: '#ddd6fe',   // Light
          300: '#c4b5fd',   // Light accent
          400: '#a78bfa',   // Medium light
          500: '#9f7aea',   // Main secondary color
          600: '#805ad5',   // Hover state
          700: '#6b46c1',   // Active/pressed
          800: '#553c9a',   // Dark accent
          900: '#44337a',   // Very dark
          950: '#322659',   // Darkest
          DEFAULT: '#9f7aea',
          foreground: '#ffffff',
          // Interactive states
          light: '#f5f3ff',
          hover: '#805ad5',
          pressed: '#6b46c1',
        },

        // ===== Semantic Status Colors =====
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',   // Default
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
          foreground: '#ffffff',
        },

        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',   // Default
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },

        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',   // Default
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },

        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',   // Default
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },

        // Status aliases (for component compatibility)
        'status-success': '#10b981',
        'status-warning': '#f59e0b',
        'status-error': '#ef4444',
        'status-info': '#3b82f6',

        // ===== Gray Scale =====
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },

        // ===== Semantic UI Colors (CSS Variables) =====
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // ===== Extended Border Colors =====
        'border-light': '#e5e7eb',     // gray-200
        'border-medium': '#d1d5db',    // gray-300
        'border-strong': '#9ca3af',    // gray-400

        // ===== Text Colors =====
        text: {
          primary: '#1f2937',    // gray-800
          secondary: '#4b5563',  // gray-600
          tertiary: '#9ca3af',   // gray-400
          inverted: '#ffffff',
          muted: '#6b7280',      // gray-500
        },

        // ===== Surface Colors =====
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f9fafb',        // gray-50
          elevated: '#ffffff',
          overlay: 'rgba(0, 0, 0, 0.5)',
        },

        // ===== Switch Component =====
        'switch-background': '#e5e7eb',
      },

      /**
       * ========================================
       * TYPOGRAPHY SYSTEM
       * ========================================
       * - Korean-optimized font stack (Noto Sans KR)
       * - Harmonious heading scale (1.25 ratio)
       * - Accessible line heights
       */
      fontFamily: {
        sans: ['Noto Sans KR', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Noto Sans KR', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },

      fontSize: {
        // ===== Display Scale (For heroes, large headings) =====
        'display-2xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.03em' }],   // 72px
        'display-xl': ['3.75rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.025em' }],  // 60px
        'display-lg': ['3rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],     // 48px

        // ===== Heading Scale =====
        'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],      // 40px
        'h2': ['2rem', { lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.015em' }],      // 32px
        'h3': ['1.75rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],     // 28px
        'h4': ['1.5rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.005em' }],    // 24px
        'h5': ['1.25rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],           // 20px
        'h6': ['1.125rem', { lineHeight: '1.45', fontWeight: '600', letterSpacing: '0' }],         // 18px

        // ===== Body Scale =====
        'body-xl': ['1.25rem', { lineHeight: '1.75', fontWeight: '400' }],   // 20px - Large text
        'body-lg': ['1.125rem', { lineHeight: '1.75', fontWeight: '400' }],  // 18px - Lead text
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],          // 16px - Base body
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],   // 14px - Small body
        'body-xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],    // 12px - Extra small

        // ===== UI Elements =====
        'label': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],     // 14px - Form labels
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],    // 12px - Captions
        'overline': ['0.75rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.1em' }], // 12px - Overline
        'button': ['0.875rem', { lineHeight: '1', fontWeight: '600' }],      // 14px - Buttons
        'button-sm': ['0.75rem', { lineHeight: '1', fontWeight: '600' }],    // 12px - Small buttons
        'button-lg': ['1rem', { lineHeight: '1', fontWeight: '600' }],       // 16px - Large buttons
      },

      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      /**
       * ========================================
       * SPACING SYSTEM
       * ========================================
       * Based on 4px grid (0.25rem)
       * Consistent scale for padding, margin, gap
       */
      spacing: {
        'px': '1px',
        '0': '0',
        '0.5': '0.125rem',    // 2px
        '1': '0.25rem',       // 4px
        '1.5': '0.375rem',    // 6px
        '2': '0.5rem',        // 8px
        '2.5': '0.625rem',    // 10px
        '3': '0.75rem',       // 12px
        '3.5': '0.875rem',    // 14px
        '4': '1rem',          // 16px
        '5': '1.25rem',       // 20px
        '6': '1.5rem',        // 24px
        '7': '1.75rem',       // 28px
        '8': '2rem',          // 32px
        '9': '2.25rem',       // 36px
        '10': '2.5rem',       // 40px
        '11': '2.75rem',      // 44px
        '12': '3rem',         // 48px
        '14': '3.5rem',       // 56px
        '16': '4rem',         // 64px
        '18': '4.5rem',       // 72px
        '20': '5rem',         // 80px
        '24': '6rem',         // 96px
        '28': '7rem',         // 112px
        '32': '8rem',         // 128px
        '36': '9rem',         // 144px
        '40': '10rem',        // 160px
        '44': '11rem',        // 176px
        '48': '12rem',        // 192px
        '52': '13rem',        // 208px
        '56': '14rem',        // 224px
        '60': '15rem',        // 240px
        '64': '16rem',        // 256px
        '72': '18rem',        // 288px
        '80': '20rem',        // 320px
        '96': '24rem',        // 384px

        // Component-specific spacing tokens
        'card-padding': '1.5rem',     // 24px
        'card-padding-sm': '1rem',    // 16px
        'section-gap': '2rem',        // 32px
        'page-padding': '1.5rem',     // 24px
        'page-padding-lg': '2rem',    // 32px
      },

      /**
       * ========================================
       * BORDER RADIUS SYSTEM
       * ========================================
       */
      borderRadius: {
        'none': '0',
        'xs': '0.125rem',     // 2px
        'sm': '0.25rem',      // 4px
        DEFAULT: '0.5rem',    // 8px
        'md': '0.5rem',       // 8px
        'lg': '0.75rem',      // 12px
        'xl': '1rem',         // 16px
        '2xl': '1.25rem',     // 20px
        '3xl': '1.5rem',      // 24px
        '4xl': '2rem',        // 32px
        'full': '9999px',

        // Component tokens
        'button': '0.75rem',  // 12px
        'button-sm': '0.5rem', // 8px
        'button-lg': '1rem',  // 16px
        'input': '0.75rem',   // 12px
        'card': '1rem',       // 16px
        'card-lg': '1.5rem',  // 24px
        'badge': '9999px',    // pill
        'tag': '0.375rem',    // 6px
      },

      /**
       * ========================================
       * SHADOW SYSTEM
       * ========================================
       * Layered elevation with consistent blur/spread
       */
      boxShadow: {
        'none': 'none',

        // Standard elevation
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

        // Design system tokens
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px -4px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'hard': '0 8px 24px -6px rgba(0, 0, 0, 0.16), 0 4px 8px -4px rgba(0, 0, 0, 0.08)',
        'elevated': '0 12px 32px -8px rgba(0, 0, 0, 0.18), 0 6px 12px -6px rgba(0, 0, 0, 0.1)',

        // Component-specific
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px -6px rgba(0, 0, 0, 0.14), 0 4px 8px -4px rgba(0, 0, 0, 0.06)',
        'button': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'button-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'dropdown': '0 10px 40px -8px rgba(0, 0, 0, 0.16), 0 4px 12px -4px rgba(0, 0, 0, 0.08)',
        'modal': '0 24px 48px -12px rgba(0, 0, 0, 0.24), 0 12px 24px -8px rgba(0, 0, 0, 0.12)',
        'popover': '0 8px 32px -8px rgba(0, 0, 0, 0.16), 0 4px 12px -4px rgba(0, 0, 0, 0.08)',

        // Glow effects (for focus, emphasis)
        'glow': '0 0 16px rgba(0, 201, 183, 0.4)',
        'glow-primary': '0 0 20px rgba(0, 201, 183, 0.35)',
        'glow-secondary': '0 0 20px rgba(159, 122, 234, 0.35)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.35)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.35)',

        // Focus ring (for accessibility)
        'focus': '0 0 0 3px rgba(0, 201, 183, 0.4)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.4)',
      },

      /**
       * ========================================
       * ANIMATION SYSTEM
       * ========================================
       */
      animation: {
        // Entrance animations
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'fade-in-down': 'fadeInDown 0.3s ease-out',
        'fade-in-left': 'fadeInLeft 0.3s ease-out',
        'fade-in-right': 'fadeInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',

        // Exit animations
        'fade-out': 'fadeOut 0.15s ease-in',
        'scale-out': 'scaleOut 0.15s ease-in',

        // Looping animations
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',

        // Loading states
        'shimmer': 'shimmer 2s linear infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',

        // Attention grabbing
        'shake': 'shake 0.5s ease-in-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',

        // UI specific
        'accordion-down': 'accordionDown 0.2s ease-out',
        'accordion-up': 'accordionUp 0.2s ease-out',
        'dialog-show': 'dialogShow 0.2s ease-out',
        'dialog-hide': 'dialogHide 0.15s ease-in',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        wave: {
          '0%': { transform: 'translateX(-100%)' },
          '50%, 100%': { transform: 'translateX(100%)' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        accordionDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        accordionUp: {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        dialogShow: {
          '0%': { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        dialogHide: {
          '0%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
        },
        ping: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },

      /**
       * ========================================
       * RESPONSIVE BREAKPOINTS
       * ========================================
       * Mobile-first approach
       */
      screens: {
        'xs': '375px',     // Mobile S (iPhone SE)
        'sm': '640px',     // Mobile L / Small tablet
        'md': '768px',     // Tablet portrait
        'lg': '1024px',    // Tablet landscape / Small desktop
        'xl': '1280px',    // Desktop
        '2xl': '1536px',   // Large desktop
        '3xl': '1920px',   // Extra large

        // Max-width variants
        'max-xs': { 'max': '374px' },
        'max-sm': { 'max': '639px' },
        'max-md': { 'max': '767px' },
        'max-lg': { 'max': '1023px' },
        'max-xl': { 'max': '1279px' },
        'max-2xl': { 'max': '1535px' },

        // Touch/pointer variants
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'stylus': { 'raw': '(hover: none) and (pointer: fine)' },
        'pointer': { 'raw': '(hover: hover) and (pointer: fine)' },
      },

      /**
       * ========================================
       * ACCESSIBILITY - TOUCH TARGETS
       * ========================================
       * Minimum 44x44 for iOS, 48x48 for Android (Material)
       */
      minHeight: {
        'touch': '44px',
        'touch-android': '48px',
        'touch-sm': '36px',
      },
      minWidth: {
        'touch': '44px',
        'touch-android': '48px',
        'touch-sm': '36px',
      },

      /**
       * ========================================
       * Z-INDEX SCALE
       * ========================================
       */
      zIndex: {
        'base': '0',
        'above': '10',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'drawer': '1040',
        'modal-backdrop': '1050',
        'modal': '1060',
        'popover': '1070',
        'tooltip': '1080',
        'toast': '1090',
        'max': '9999',
      },

      /**
       * ========================================
       * TRANSITION SYSTEM
       * ========================================
       */
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      transitionTimingFunction: {
        'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'linear': 'linear',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'snappy': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      /**
       * ========================================
       * CONTAINER
       * ========================================
       */
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
          '2xl': '3rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        },
      },

      /**
       * ========================================
       * OPACITY SCALE
       * ========================================
       */
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1',
        '15': '0.15',
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '35': '0.35',
        '40': '0.4',
        '45': '0.45',
        '50': '0.5',
        '55': '0.55',
        '60': '0.6',
        '65': '0.65',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '85': '0.85',
        '90': '0.9',
        '95': '0.95',
        '100': '1',
      },

      /**
       * ========================================
       * ASPECT RATIO
       * ========================================
       */
      aspectRatio: {
        'auto': 'auto',
        'square': '1 / 1',
        'video': '16 / 9',
        'portrait': '3 / 4',
        'landscape': '4 / 3',
        'wide': '21 / 9',
        'ultrawide': '32 / 9',
      },
    },
  },
  plugins: [],
}
