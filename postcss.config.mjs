/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind 4's own PostCSS plugin (Lightning CSS) handles prefixing.
    "@tailwindcss/postcss": {},
  },
};

export default config;
