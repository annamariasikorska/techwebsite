/** @type {import("prettier").Config} */
export default {
  useTabs: false,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  bracketSameLine: false,
  trailingComma: 'all',
  arrowParens: 'avoid',
  printWidth: 100,
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
