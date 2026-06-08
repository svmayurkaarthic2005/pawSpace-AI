const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');
// Mobile app root
const projectRoot = __dirname;

const defaultConfig = getDefaultConfig(projectRoot);

const config = {
  projectRoot,
  watchFolders: [monorepoRoot],
  resolver: {
    ...defaultConfig.resolver,
    unstable_enableSymlinks: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      events: path.resolve(projectRoot, 'node_modules/events'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
