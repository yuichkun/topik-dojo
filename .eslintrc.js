module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:date/recommended'],
  plugins: ['date'],
  rules: {
    'date/no-new-date-with-args': 'error',
    'date/no-new-date-without-args': 'error',
  },
};
