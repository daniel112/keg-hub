/* eslint-disable */

const path = require('path')
const tapPath = require('app-root-path').path
const kegPath = path.join(__dirname, '../../')
const getExpoConfig = require('@expo/webpack-config')
const babelConfig = require(path.join(kegPath, './babel.config'))()
const { NODE_ENV } = process.env

/**
 * Dependencies to be resolved to keg-core/node_modules/<repo name>
 */
const resolveCoreAlias = {
  react: 'react',
  'react-native': 'react-native-web',
  'react-native-web': 'react-native-web',
  '@expo/vector-icons': '@expo/vector-icons',
  'react-native-vector-icons': 'react-native-vector-icons',
  '@simpleviewinc/re-theme': '@simpleviewinc/re-theme/build/esm/reTheme.js',
  '@simpleviewinc/keg-components':
    '@simpleviewinc/keg-components/build/esm/kegComponents.native.js',
}

/**
 * Maps the core resolve alias to the node_modules path in keg-core
 * This ensures other repos pull from keg-cores node_modules for these dependencies
 */
const buildResolveCoreAlias = (curAlias = {}) => {
  return Object.entries(resolveCoreAlias).reduce(
    (allAlias, [name, aliasPath]) => {
      allAlias[name] = path.join(kegPath, 'node_modules', aliasPath)

      return allAlias
    },
    curAlias
  )
}

module.exports = rootDir => {
  return async (env, argv) => {
    /**
     * Get the default expo webpack config so we can add the tap-resolver
     */
    const config = await getExpoConfig(env, argv)

    /**
     * Force the correct NODE_ENV for the webpack bundle
     */
    config.mode = NODE_ENV || 'development'

    /**
     * Setup our JS files to use the tap-resolver through babel
     */
    config.module.rules.unshift({
      test: /\.js?$/,
      include: [path.resolve(tapPath)],
      exclude: /node_modules\/(?!(keg-core)\/).*/,
      loader: require.resolve('babel-loader'),
      options: { ...babelConfig },
    })

    // necessary to provide web workers access to the window object and
    // postMessage function (see https://github.com/webpack/webpack/issues/6642#issuecomment-371087342)
    config.output.globalObject = 'this'

    // Fixes "Multiple assets emit different content to the same filename" error
    // (see https://github.com/webpack/webpack/issues/9732#issuecomment-555461786)
    config.output.sourceMapFilename = '[file].map[query]'

    /**
     * Ensure node_modules can be resolved for both the keg and the tap
     */
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
      path.resolve(tapPath, 'node_modules'),
      path.resolve(kegPath, 'node_modules'),
    ]

    /**
     * Define aliases to the core versions of node_modules
     */
    config.resolve.alias = buildResolveCoreAlias(config.resolve.alias)

    return config
  }
}
