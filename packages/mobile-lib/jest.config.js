module.exports = {
  preset: 'react-native',
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],

  transformIgnorePatterns: [
    'node_modules/(?!((@react-native|react-native)/|\\.pnpm/))',
  ],
};
