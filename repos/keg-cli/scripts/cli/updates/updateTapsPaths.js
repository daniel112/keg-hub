require('module-alias/register')

const { Logger } = require('KegLog')
const { get, set, isStr, reduceObj } = require('@keg-hub/jsutils')
const { getGlobalConfig } = require('KegUtils/globalConfig/getGlobalConfig')
const { GLOBAL_CONFIG_FOLDER, GLOBAL_CONFIG_PATHS } = require('KegConst/constants')
const { addGlobalConfigProp } = require('KegUtils/globalConfig/addGlobalConfigProp')

;(async () => {

  try {
    Logger.empty()
    Logger.log(`Updating linked taps...`)

    const globalConfig = getGlobalConfig()
    const tapLinks = get(globalConfig, `${ GLOBAL_CONFIG_PATHS.TAP_LINKS }.links`)

    if(!tapLinks){
      Logger.warn(`Linked taps already updated!`)
      return Logger.empty()
    }

    const updatedTaps = reduceObj(tapLinks, (alias, path, tapsObj) => {
      isStr(path)
        ? (tapsObj[alias] = { path })
        : (tapsObj[alias] = path)

      return tapsObj
    }, {})

    // Save the taps to the global config
    addGlobalConfigProp(
      globalConfig,
        // Build the path in the globalConfig where the linked taps will be saved
      `${GLOBAL_CONFIG_PATHS.TAP_LINKS}`,
      updatedTaps
    )

  }
  catch(err){
    Logger.warn(`Error updating linked taps...`)
    Logger.error(err.message)
    return Logger.empty()
  }

  Logger.success(`Finished updating linked taps!`)
  return Logger.empty()

})()