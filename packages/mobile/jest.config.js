module.exports = {
  preset: 'react-native',

  rootDir: '.',

  testEnvironment: 'node',

  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@react-navigation|.*\\.pnpm)',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  moduleNameMapper: {
    '^@hiperhealth/hphvision-lib$': '<rootDir>/../mobile-lib/src',
    '^@hiperhealth/hphvision-lib/(.*)$': '<rootDir>/../mobile-lib/src/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
