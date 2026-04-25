// Metro config for npm workspaces monorepo
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so changes in packages/shared trigger rebuilds
config.watchFolders = [monorepoRoot];

// Make Metro resolve packages from the workspace root first, then locally
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Don't disable hierarchical lookup — npm workspaces needs it
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
