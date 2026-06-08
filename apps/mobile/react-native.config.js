/**
 * React Native Configuration for Monorepo
 * 
 * This file explicitly tells React Native CLI where to find native modules
 * when running in a monorepo structure. Without this, autolinking fails.
 */

module.exports = {
  project: {
    ios: {},
    android: {},
  },
  dependencies: {
    // Let React Native CLI handle autolinking for maps modules
    // Custom paths removed as they cause validation errors
  },
  assets: ['./src/assets/fonts/'],
};
