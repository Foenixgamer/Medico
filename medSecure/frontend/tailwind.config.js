/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E1F5EE',
          100: '#C2EBDE',
          200: '#85D7BD',
          300: '#48C39C',
          400: '#1A9E75',
          500: '#0F6E56',
          600: '#085041',
          700: '#04382D',
          800: '#02241C',
          900: '#011410',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f5f5f3',
          dark: '#242422',
        },
        border: {
          DEFAULT: '#e2e2e2',
          secondary: '#d3d1c7',
          dark: '#3a3a3a',
        },
        text: {
          primary: '#111827',
          secondary: '#888780',
          tertiary: '#888780',
        },
        role: {
          admin: '#0F6E56',
          doctor: '#0C447C',
          nurse: '#633806',
          patient: '#444441',
        },
        rolebg: {
          admin: '#E1F5EE',
          doctor: '#E6F1FB',
          nurse: '#FAEEDA',
          patient: '#F1EFE8',
        },
        danger: {
          400: '#E24B4A',
          500: '#DC2626',
        },
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
      },
      letterSpacing: {
        label: '0.04em',
        wide: '0.06em',
      },
    },
  },
  plugins: [],
};
