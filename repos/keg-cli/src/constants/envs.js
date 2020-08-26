const path = require('path')
const { Logger } = require('../libs/logger')
const { tryCatch } = require('../utils/helpers/tryCatch')
const { copyFileSync, loadENV } = require('../libs/fileSys')
const { CLI_ROOT, GLOBAL_CONFIG_FOLDER, DEFAULT_ENV } = require('../constants')

/**
 * Holds the loaded env file, so we don't keep reloading it
 * @object
 **/
let __DEFAULT_ENVS

/**
 * Logs a message when envs can't be loaded
 *
 * @returns {void}
 **/
const noENVLog = () => {
  Logger.empty()
  Logger.log(
    Logger.colors[Logger.colorMap.error](`  Could not find global`),
    Logger.colors[Logger.colorMap.data](DEFAULT_ENV),
  )
  Logger.log(
    Logger.colors[Logger.colorMap.info](`  Creating from path`),
    Logger.colors[Logger.colorMap.data](`scripts/setup/${ DEFAULT_ENV }`),
  )
  Logger.empty()
}

/**
 * Tries to load a defaults.env config from the global config folder
 * If not found, it creates it by copying the keg-cli version to the config directory
 * @param {string} cliRootDir - Root directory path of the keg-cli
 *
 * @returns {Object} - Loaded default.env file as an object
 **/
const getDefaultENVs = cliRootDir => {

  // If the default envs have already been loaded, then return the cached object
  if(__DEFAULT_ENVS) return __DEFAULT_ENVS

  // Build the path to the global defaults env
  const globalDefEnv = path.join(GLOBAL_CONFIG_FOLDER, '/', DEFAULT_ENV)

  // Try to load the default envs
  tryCatch(
    () => { __DEFAULT_ENVS = loadENV(globalDefEnv) },
    err => {
      // Log the error when no ENVs can be loaded
      noENVLog(err)

      // Copy the local default.env file to the global defaults env directory
      copyFileSync(path.join(cliRootDir, 'scripts/setup/', DEFAULT_ENV), globalDefEnv)

      // Load the default envs
      __DEFAULT_ENVS = loadENV(globalDefEnv)
    }
  )

  return __DEFAULT_ENVS

}


module.exports = {
  KEG_ENVS: getDefaultENVs(CLI_ROOT)
}