module.exports = {
  root: true,
  plugins: ['date'],
  rules: {
    'date/no-new-date-with-args': 'error',
    'date/no-new-date-without-args': 'error',
  },
  parser: '@typescript-eslint/parser',
};
