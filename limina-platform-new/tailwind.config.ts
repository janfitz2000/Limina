import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        limina: {
          bg: '#0C0A09',
          card: '#161413',
          gold: '#C9A227',
          'gold-hover': '#D4AF37',
          text: '#FAF9F6',
        },
        primary: '#10344C',
        'primary-medium': '#1e5b8a',
        'primary-light': '#2d81c4',
        accent: '#C9A227',
        'accent-light': '#D4AF37',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}

export default config
