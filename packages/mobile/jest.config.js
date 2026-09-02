module.exports = {
  preset: 'react-native',

  moduleNameMapper: {
    '^@hiperhealth/hphvision-lib$': '<rootDir>/../mobile-lib/src',
    '^@hiperhealth/hphvision-lib/(.*)$': '<rootDir>/../mobile-lib/src/',
  },

  transformIgnorePatterns: [
    'node_modules/(?!((@react-native|react-native)/|\\.pnpm/))',
  ],
};
