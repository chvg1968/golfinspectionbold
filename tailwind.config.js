/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
<<<<<<< HEAD
    '@tailwindcss/forms',
=======
    require('@tailwindcss/forms'),
>>>>>>> f0b21650ba5eb0efc04b5981ca6969c441ed5566
  ],
};