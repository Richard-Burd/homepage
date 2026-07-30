// https://prettier.io/docs/en/options.html
/** @type {import('prettier').RequiredOptions} */
const config = {
  trailingComma: 'es5',
  semi: false,
  singleQuote: true,
  overrides: [
    {
      files: 'Routes.*',
      options: {
        printWidth: 999,
      },
    },
  ],
  // tailwindConfig: './web/config/tailwind.config.js',
  tailwindStylesheet: './app/globals.css',
  plugins: ['prettier-plugin-tailwindcss'],
}

export default config
