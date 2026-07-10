module.exports = {
  presets: ['module:@react-native/babel-preset'],

  plugins: [
    '@babel/plugin-transform-flow-strip-types',
  ],

  env: {
    test: {
      plugins: [
        '@babel/plugin-transform-flow-strip-types',
      ],
    },
  },
};