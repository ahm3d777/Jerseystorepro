/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './{App,index}.tsx', './{components,pages,context,admin,lib}/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Adaptive surface & text tokens (switch between DESIGN.md Dark Luxury and Light Editorial via CSS variables)
        background: 'rgb(var(--c-background) / <alpha-value>)',
        'on-background': 'rgb(var(--c-on-background) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-dim': 'rgb(var(--c-surface-dim) / <alpha-value>)',
        'surface-bright': 'rgb(var(--c-surface-bright) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--c-surface-container-lowest) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--c-surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--c-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--c-surface-container-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--c-surface-container-highest) / <alpha-value>)',
        'surface-variant': 'rgb(var(--c-surface-container-highest) / <alpha-value>)',
        'surface-charcoal': 'rgb(var(--c-surface-charcoal) / <alpha-value>)',
        'surface-charcoal-elevated': 'rgb(var(--c-surface-charcoal-elevated) / <alpha-value>)',
        'surface-border': 'rgb(var(--c-surface-border) / <alpha-value>)',
        'on-surface': 'rgb(var(--c-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--c-on-surface-variant) / <alpha-value>)',
        'text-primary': 'rgb(var(--c-text-primary) / <alpha-value>)',
        'text-muted': 'rgb(var(--c-text-muted) / <alpha-value>)',
        outline: 'rgb(var(--c-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--c-outline-variant) / <alpha-value>)',

        // Fixed brand & accent tokens from DESIGN.md
        'inverse-surface': '#e5e1e4',
        'inverse-on-surface': '#313032',
        'surface-tint': '#ffb3b6',
        primary: '#ffb3b6',
        'on-primary': '#68001a',
        'primary-container': '#e11d48',
        'on-primary-container': '#fffaf9',
        'inverse-primary': '#be0037',
        'crimson-vibrant': '#ff2a5f',
        secondary: '#e9c349',
        'on-secondary': '#3c2f00',
        'secondary-container': '#af8d11',
        'on-secondary-container': '#342800',
        'gold-light': '#f6e05e',
        'gold-muted': '#9a7b2c',
        tertiary: '#7bd0ff',
        'on-tertiary': '#00354a',
        'tertiary-container': '#007ca8',
        'on-tertiary-container': '#f8fbff',
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
        'primary-fixed': '#ffdada',
        'primary-fixed-dim': '#ffb3b6',
        'on-primary-fixed': '#40000c',
        'on-primary-fixed-variant': '#920028',
        'secondary-fixed': '#ffe088',
        'secondary-fixed-dim': '#e9c349',
        'on-secondary-fixed': '#241a00',
        'on-secondary-fixed-variant': '#574500',
        'tertiary-fixed': '#c4e7ff',
        'tertiary-fixed-dim': '#7bd0ff',
        'on-tertiary-fixed': '#001e2c',
        'on-tertiary-fixed-variant': '#004c69',
        'pitch-green': '#43640f',

        // Legacy brand aliases preserved for backward compatibility
        brand: {
          crimson: '#e11d48',
          crimsonDark: '#be0037',
          royal: '#0F172A',
          royalLight: '#1E293B',
          dark: '#131315',
          gold: '#e9c349',
          goldLight: '#f6e05e',
          offWhite: '#FAFAFA',
          glass: 'rgba(20, 20, 24, 0.8)'
        }
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px'
      },
      spacing: {
        'gutter': '1.5rem',
        'gutter-mobile': '1rem',
        'margin': '3rem',
        'margin-mobile': '1.25rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        'space-2xl': '4rem',
        'space-3xl': '6rem'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        sport: ['"Space Grotesk"', '"Oswald"', 'sans-serif'],
        'body-lg': ['"Plus Jakarta Sans"', 'sans-serif'],
        'body-md': ['"Plus Jakarta Sans"', 'sans-serif'],
        'body-sm': ['"Plus Jakarta Sans"', 'sans-serif'],
        'title-sm': ['"Plus Jakarta Sans"', 'sans-serif'],
        'display-hero': ['"Space Grotesk"', 'sans-serif'],
        'display-hero-mobile': ['"Space Grotesk"', 'sans-serif'],
        'headline-xl': ['"Space Grotesk"', 'sans-serif'],
        'headline-xl-mobile': ['"Space Grotesk"', 'sans-serif'],
        'headline-lg': ['"Space Grotesk"', 'sans-serif'],
        'headline-md': ['"Space Grotesk"', 'sans-serif'],
        'label-caps': ['"Space Grotesk"', 'sans-serif'],
        'label-numeric': ['"Space Grotesk"', 'sans-serif']
      },
      fontSize: {
        'display-hero': ['56px', { lineHeight: '64px', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-hero-mobile': ['36px', { lineHeight: '42px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-xl-mobile': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '30px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'label-caps': ['11px', { lineHeight: '16px', letterSpacing: '0.12em', fontWeight: '700' }],
        'label-numeric': ['15px', { lineHeight: '20px', letterSpacing: '-0.01em', fontWeight: '600' }]
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-out': 'fadeOut 0.45s ease-in forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-up-delayed': 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards',
        'zoom-in-slow': 'zoomInSlow 20s linear infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'shine': 'shine 1.5s ease-in-out infinite',
        'roll-across': 'rollAcross 2s ease-in-out infinite',
        'ball-roll': 'ballRoll 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'load-progress': 'loadProgress 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'marquee': 'marquee 30s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'badge-pop': 'badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        zoomInSlow: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        rollAcross: {
          '0%': { transform: 'translateX(-100%) rotate(0deg)' },
          '100%': { transform: 'translateX(400%) rotate(720deg)' }
        },
        ballRoll: {
          '0%': { left: '0%', transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { left: '100%', transform: 'translate(-50%, -50%) rotate(720deg)' }
        },
        loadProgress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        badgePop: {
          '0%': { transform: 'scale(0.4)' },
          '100%': { transform: 'scale(1)' }
        }
      }
    }
  }
};
