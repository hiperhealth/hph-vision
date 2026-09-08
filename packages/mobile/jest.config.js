module.exports = {
  preset: 'react-native',

  testMatch: ['**/tests/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm|@react-native|react-native|@react-native-community)',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
