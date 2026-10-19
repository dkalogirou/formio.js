const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Needed for the `afse-formio-react/schema` subpath the library imports.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
