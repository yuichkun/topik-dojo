/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#002897',
          container: '#003ace',
          'fixed-dim': '#b8c3ff',
        },
        'on-primary': '#ffffff',
        surface: {
          DEFAULT: '#f8f9fa',
          'container-lowest': '#ffffff',
          'container-low': '#f3f4f5',
          container: '#edeeef',
          'container-high': '#e7e8ea',
          'container-highest': '#e1e3e5',
        },
        'on-background': '#191c1d',
        'on-surface-variant': '#434653',
        'outline-variant': '#c3c6d5',
      },
      fontFamily: {
        display: ['Epilogue_700Bold'],
        headline: ['Epilogue_600SemiBold'],
        body: ['Manrope_400Regular'],
        'body-medium': ['Manrope_500Medium'],
        label: ['Manrope_600SemiBold'],
      },
      fontSize: {
        'display-lg': '36px',
        'display-md': '30px',
        'display-sm': '24px',
        'headline-lg': '22px',
        'headline-md': '18px',
        'body-lg': '16px',
        'body-md': '14px',
        'body-sm': '12px',
        'label-lg': '14px',
        'label-md': '12px',
        'label-sm': '11px',
      },
    },
  },
  plugins: [],
}
