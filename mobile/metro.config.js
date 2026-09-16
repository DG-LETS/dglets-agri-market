const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.projectRoot = __dirname;
config.watchFolders = [__dirname];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

/*
 * FIX: import.meta outside a module
 *
 * Some packages (zustand, @tanstack/react-query, etc.) ship ESM .mjs files
 * that contain import.meta. Metro's web bundler does not handle import.meta
 * and crashes.
 *
 * Solution: disable package exports resolution so Metro always falls back to
 * the CJS "main" / "browser" fields instead of picking the ESM "import"
 * condition from package.json exports.
 */
config.resolver.unstable_enablePackageExports = false;

/*
 * Field order: 'browser' before 'react-native' so web-compatible CJS
 * entry points are preferred over native ones on the web platform.
 */
config.resolver.resolverMainFields = ['browser', 'react-native', 'main'];

config.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'cjs', 'json',
  // Keep mjs last so CJS is always preferred
  'mjs',
];

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
