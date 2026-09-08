module.exports = {
  preset: 'react-native',

  testMatch: ['**/tests/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!((@react-native|react-native|@react-native-community)/|\\.pnpm/(@react-native\\+js-polyfills|react-native)@[^/]+/node_modules/(@react-native/js-polyfills|react-native)/))',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
