module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'logs/', 'public/'],
  rules: {
    'no-unused-vars': ['warn', { 
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    'no-console': 'off',
    'no-undef': 'error',
    'no-dupe-keys': 'error',
  },
  globals: {
    process: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    Buffer: 'readonly',
    global: 'readonly',
    setImmediate: 'readonly',
    clearImmediate: 'readonly',
    Intl: 'readonly',
  },
};
