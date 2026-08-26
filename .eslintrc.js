module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.expo/',
    '.metro/',
    '.cache/',
  ],
  overrides: [
    {
      files: ['packages/mobile-lib/**/*.ts', 'packages/mobile-lib/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './packages/mobile-lib/tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  ],
};
