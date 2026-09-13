const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/* Explicitly set the project root and watch folders */
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

/* Ensure node_modules resolution works from the project root */
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'cjs', 'json'
];

module.exports = config;
