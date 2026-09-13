const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/* We use React Navigation (not Expo Router) — no router root */
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

/* Ensure TypeScript and JS extensions are resolved */
config.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'cjs', 'json'
];

module.exports = config;
