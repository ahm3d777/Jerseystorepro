/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './{App,index}.tsx', './{components,pages,context,admin,lib}/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          crimson: '#D40D36', // Rich Ruby Red
          crimsonDark: '#9F0A28', // Deep Burgundy
          royal: '#0F172A', // Slate 900 (Deepest Navy)
          royalLight: '#1E293B', // Slate 800
          dark: '#050505', // Luxury Black
          gold: '#CFA238', // Champagne/Metallic Gold
          goldLight: '#E5C468',
          offWhite: '#FAFAFA', // Alabaster White
          glass: 'rgba(255, 255, 255, 0.8)'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        sport: ['"Oswald"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-out': 'fadeOut 0.5s ease-in forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-up-delayed': 'slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards',
        'zoom-in-slow': 'zoomInSlow 20s linear infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'shine': 'shine 1.5s ease-in-out infinite',
        'roll-across': 'rollAcross 2s ease-in-out infinite',
        'ball-roll': 'ballRoll 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'load-progress': 'loadProgress 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'marquee': 'marquee 30s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        zoomInSlow: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.15)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
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
          '100%': { left: '100%', transform: 'translate(-50%, -50%) rotate(1080deg)' }
        },
        loadProgress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    }
  }
};
