module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-underscore-dangle': ['error', { allow: ['_id', '_doc'] }],
    'consistent-return': 'off',
    'func-names': 'off',
    'object-shorthand': 'off',
    'no-process-exit': 'off',
    'class-methods-use-this': 'off',
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
  },
};
