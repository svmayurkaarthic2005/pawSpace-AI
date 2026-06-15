const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');
// Mobile app root
const projectRoot = __dirname;

const defaultConfig = getDefaultConfig(projectRoot);

// ─── Why resolveRequest is needed ─────────────────────────────────────────────
// npm workspaces hoists ALL dependencies (react-query, reanimated, navigation,
// zustand, etc.) to the ROOT node_modules, not apps/mobile/node_modules.
// When Metro bundles those hoisted packages, they call require('react') and
// standard node resolution finds ROOT/node_modules/react (v18.3.1).
// Meanwhile App.tsx uses MOBILE/node_modules/react (v18.2.0).
// Two React instances in one JS runtime → "Cannot read property 'useEffect' of null".
//
// extraNodeModules only works as a FALLBACK (when normal resolution fails).
// resolveRequest is a full override — it intercepts every require('react') call
// regardless of which package triggers it and forces mobile's copy.
// ──────────────────────────────────────────────────────────────────────────────


/**
 * Force 'react' (and react/* sub-paths like react/jsx-runtime) to always
 * resolve from apps/mobile/node_modules, no matter which package triggers
 * the import.
 *
 * NOTE: We intentionally do NOT pin 'react-native' here because:
 *  1. react-native is not duplicated (only one copy exists)
 *  2. Metro has special platform-aware resolution for react-native/* sub-paths
 *     (e.g. Platform.android.js vs Platform.ios.js) that require.resolve
 *     would bypass, breaking native modules.
 */
function resolveRequest(context, moduleName, platform) {
  const isPinned =
    moduleName === 'react' ||
    moduleName.startsWith('react/');

  if (isPinned) {
    try {
      const filePath = require.resolve(moduleName, { paths: [projectRoot] });
      return { filePath, type: 'sourceFile' };
    } catch (_) {
      // Fall through to default resolution if require.resolve fails
    }
  }

  return context.resolveRequest(context, moduleName, platform);
}

const config = {
  projectRoot,
  watchFolders: [monorepoRoot],
  resolver: {
    ...defaultConfig.resolver,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      events: path.resolve(projectRoot, 'node_modules/events'),
    },
    resolveRequest,
    blockList: [
      // Ignore Android build directories
      /.*\/android\/build\/.*/,
      /.*\/android\/app\/build\/.*/,
      // Ignore iOS build directories
      /.*\/ios\/build\/.*/,
      /.*\/ios\/Pods\/.*/,
      // Ignore temporary package directories
      /.*\/node_modules\/\.react-native-screens-.*/,
      /.*\/node_modules\/.*\/android\/src\/main\/cpp.*/,
    ],
  },
  watcher: {
    watchman: {
      deferStates: ['hg.update'],
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
