/**
 * React Native configuration for monorepo autolinking
 * This ensures react-native-maps and other native modules are properly linked
 */
const path = require('path');

module.exports = {
  project: {
    android: {},
    ios: {},
  },
  dependencies: {
    'react-native-maps': {
      // Point to the root node_modules where react-native-maps is actually located
      root: path.resolve(__dirname, '../../node_modules/react-native-maps'),
    },
  },
};
