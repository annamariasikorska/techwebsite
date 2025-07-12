/* eslint-disable @typescript-eslint/no-require-imports */

module.exports = {
  plugins: [
    require('@csstools/postcss-global-data')({
      files: ['./src/styles/_media.css'],
    }),
    require('postcss-preset-env')({
      autoprefixer: false,
      browsers: ['> 0.2% and not dead'],
      stage: 1,
      features: {
        'nesting-rules': false,
        'custom-media-queries': true,
        'color-function': { unresolved: 'warn' },
      },
    }),
    require('postcss-nested')(),
    require('postcss-hexrgba'),
    require('postcss-reporter')(),
  ],
};
