const { Logger } = require('KegLog')
const { toNum } = require('@keg-hub/jsutils')

/**
 * Helper to print an error
 *
 * @param {Error|Object} err - Error that was thrown
 *
 * @returns {void}
 */
const throwExitError = err => {

  Logger.header(`Keg-CLI Error:`)
  Logger.error(`  ${err.stack}`)
  Logger.empty()

  process.exit(toNum(err.status || 1))
}

module.exports = {
  throwExitError
}