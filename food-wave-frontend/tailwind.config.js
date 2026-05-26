/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#09090b', // Deep charcoal black
        matte: '#18181b',    // Soft matte black
        surface: '#27272a',  // Muted gray secondary
        brand: {
          orange: '#ea580c', // Warm orange
          gold: '#eab308',   // Golden highlights
          cream: '#fafaf9',  // Soft off-white for text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'], // For luxury headings if desired
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}