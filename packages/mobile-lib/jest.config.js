module.exports = {
  preset: 'ts-jest',

  testEnvironment: 'node',

  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  testMatch: ['**/__tests__/**/*.test.ts'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
};
