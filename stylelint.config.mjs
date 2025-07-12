/** @type {import('stylelint').Config} */

export default {
  extends: [
    'stylelint-config-html/astro',
    'stylelint-config-recess-order',
    'stylelint-config-standard',
    // 'stylelint-config-prettier',
  ],
  plugins: ['stylelint-selector-bem-pattern'],
  ignoreFiles: ['node_modules/**/*'],
  // Rule lists:
  // - https://stylelint.io/user-guide/rules/
  // - https://github.com/kristerkari/stylelint-scss#list-of-rules
  rules: {
    // Allow newlines inside class attribute values
    'string-no-newline': null,
    'selector-class-pattern': null,
    // Enforce camelCase for classes and ids, to work better
    // with CSS modules
    // 'selector-class-pattern': /^[a-z][a-zA-Z]*(-(enter|leave)(-(active|to))?)?$/,
    'selector-id-pattern': /^[a-z][a-zA-Z]*$/,
    // Limit the number of universal selectors in a selector,
    // to avoid very slow selectors
    'selector-max-universal': 1,
    'function-no-unknown': [true, { ignoreFunctions: ['a'] }],

    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'deep'],
      },
    ],
    // Disallow allow global element/type selectors in scoped modules
    // 'selector-max-type': [0, { ignore: ['child', 'descendant', 'compounded'] }],

    // BEM
    'plugin/selector-bem-pattern': {
      // componentSelectors: {
      //   initial: '^\\.{componentName}(?:--[a-z]+)?$',
      //   combined: '^\\.combined-{componentName}-[a-z]+$',
      // },
      componentName: '[a-z]+',
      preset: 'bem',
      componentSelectors: componentName => {
        const WORD = '[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*';
        const element = `(?:__${WORD})?`;
        const modifier = `(?:--${WORD}){0,2}`;
        const attribute = '(?:\\[.+\\])?';
        return new RegExp(`^\\.${componentName}${element}${modifier}${attribute}$`);
      },
      ignoreSelectors: /^\.is-.+$/,
      // utilitySelectors: '^\\.u-[a-z]+(?:-[a-zA-Z0-9]+)*+$',
      utilitySelectors: '\\.u-[a-z]',
    },
  },
};
