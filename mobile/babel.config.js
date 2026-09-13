module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          /* Disable Expo Router auto-detection — we use React Navigation */
          router: false,
        },
      ],
    ],
    plugins: [
      /* Resolve @store/, @screens/, @services/ etc path aliases */
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@':            './src',
            '@components':  './src/components',
            '@screens':     './src/screens',
            '@navigation':  './src/navigation',
            '@store':       './src/store',
            '@services':    './src/services',
            '@hooks':       './src/hooks',
            '@theme':       './src/theme',
            '@utils':       './src/utils',
            '@types':       './src/types',
          },
        },
      ],
      /* Required for react-native-reanimated */
      'react-native-reanimated/plugin',
    ],
  };
};
