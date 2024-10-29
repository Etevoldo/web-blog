// eslint.config.js
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn"
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      ecmaVersion: "latest",
      sourceType: "commonjs"
    }
  }
];

