module.exports = {
  preset: 'react-native',

  transform: {
  '^.+\\.(ts|tsx)$': [
    'ts-jest',
    {
      tsconfig: '<rootDir>/tsconfig.base.json'
    }
  ],
  '^.+\\.(js|jsx)$': 'babel-jest',
},

  // 👇 Crucial: Maps the breaking file to an empty object virtual mock.
  // This completely stops the syntax error without relying on fragile node_modules regex matches!
  moduleNameMapper: {
    '@react-native/js-polyfills/error-guard': 'jest-transform-stub'
  },

  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-native-vector-icons)/',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: [],
};