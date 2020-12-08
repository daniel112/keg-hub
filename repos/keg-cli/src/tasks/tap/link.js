const path = require('path')
const { Logger } = require('KegLog')
const { ask } = require('@keg-hub/ask-it')
const { get, set, isObj } = require('@keg-hub/jsutils')
const { GLOBAL_CONFIG_PATHS } = require('KegConst/constants')
const { addGlobalConfigProp, getTapPath } = require('KegUtils')
const { findPathByName } = require('KegUtils/helpers/findPathByName')
const { checkPathExists } = require('KegUtils/helpers/checkPathExists')

/**
 * Checks if the link already exists, and if it does asks if the user wants to overwrite
 * @param {Object} globalConfig - Global config object for the keg-cli
 * @param {string} tapName - Path to the linked tap
 *
 * @returns {boolean} - If the link should be added
 */
const ensureAddLink = async (currentTap, tapName, tapPath, silent) => {
  return currentTap && tapPath
    ? !silent && ask.confirm(`Overwrite tap link '${tapName}' => '${tapPath}'?`)
    : true
}

/**
 * Adds the tap link to the global config object and saves it
 * @param {Object} globalConfig - Global config object for the keg-cli
 * @param {string} name - Name of the tap to link
 * @param {Object} tapObj - Config object for the linked tap
 * @param {string} tapObj.path - Path to the linked tap repo
 * @param {string} tapObj.tasks - Path to the custom tasks file 
 *
 * @returns {void}
 */
const addTapLink = (globalConfig, name, tapObj) => {

  // Ensure the path to save tap links exists
  !isObj(get(globalConfig, GLOBAL_CONFIG_PATHS.TAP_LINKS)) &&
    set(globalConfig, GLOBAL_CONFIG_PATHS.TAP_LINKS, {})

  // Save the link to the global config
  addGlobalConfigProp(
    globalConfig,
      // Build the path in the globalConfig where the link will be saved
    `${GLOBAL_CONFIG_PATHS.TAP_LINKS}.${name}`,
    tapObj
  )

  Logger.success(`Successfully linked tap '${name}' => '${tapObj.path}'`)
  Logger.empty()

}

/**
 * Checks if there is a tasks folder, to load the kegs custom tasks
 * @param {Object} globalConfig - Global config object for the keg-cli
 * @param {Object} tapObj - Config object for the linked tap
 * @param {string} tapObj.path - Path to the linked tap repo
 * @param {string} tapObj.tasks - Path to the custom tasks file 
 *
 * @returns {string} - Path to the custom tasks index.js file
 */
const checkCustomTaskFile = async (globalConfig, tapObj) => {

  // Search for the tasks folder within the location path
  const [ foundPath ] = await findPathByName(
    path.join(tapObj.path),
    'tasks',
    { type: 'folder' }
  )

  // Ensure we found a path to use
  if(!foundPath || !foundPath.length) return false

  // Check for the tasks index file
  const indexFile = path.join(foundPath, 'index.js')
  const indexFileExists = await checkPathExists(indexFile)

  // If a container/tasks folder but no index file, log a warning
  // Otherwise return the indexFile path
  return !indexFileExists
    ? Logger.warn(`Linked tap task folder exists, but index.js file is missing!`)
    : indexFile

}

/**
 * Checks for a current tap path, and compares with the passed in location
 * <br/>Updates the tap location if they are different
 * @param {Object} tapObj - Config object for the linked tap
 * @param {string} tapObj.path - Path to the linked tap repo
 * @param {string} tapObj.tasks - Path to the custom tasks file 
 * @param {string} location - Global config object for the keg-cli
 *
 * @returns {string} - Path to the custom tasks index.js file
 */
const checkTapLocation = (tapObj, location) => {
  if(!tapObj.path || tapObj.path !== location) tapObj.path = location

  return tapObj
}

const buildTapObj = async (globalConfig, silent, name, location) => {

  // Get the path to the tap link
  const currentTap = get(globalConfig, `${ GLOBAL_CONFIG_PATHS.TAP_LINKS }.${ name }`)
  // Check if the link already exists, and if we should overwrite it
  const addLink = await ensureAddLink(currentTap, name, location, silent)
  // If no addLink then just return false
  if(!addLink) return false

  // Check and update the tap path if needed
  const tapObj = checkTapLocation({ ...currentTap }, location)

  // Check if there is a custom task file to add
  const customTasksFile = await checkCustomTaskFile(globalConfig, tapObj)
  customTasksFile && (tapObj.tasks = customTasksFile)

  return tapObj

}

/**
 * Creates a link in the global config to a tap's path by name
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {void}
 */
const linkTap = async args => {
  const { command, globalConfig, options, params, tasks } = args
  const { name, location, silent } = params

  // Try to build the tap object.
  const tapObj = await buildTapObj(globalConfig, silent, name, location)

  // Check if we should add the link or custom task file, or log that the link was canceled!
  ;tapObj
    ? addTapLink(globalConfig, name, tapObj)
    : !silent && (Logger.warn(`Tap link canceled!`) || Logger.empty())

}

module.exports = {
  link: {
    name: 'link',
    alias: [ 'ln' ],
    action: linkTap,
    description: `Links a tap's path to the global config`,
    example: 'keg tap link <options>',
    options: {
      name: {
        description: 'Name used to access the linked tap',
        required: true,
      },
      location: {
        alias: [ 'path', 'loc' ],
        description: `Location or path to the local tap directory. Example => /Users/developer/taps/my-tap`,
        default: process.cwd(),
      },
      silent: {
        description: 'Will fail silently if any errors occure',
        example: 'keg tap link --silent',
        default: false
      }
    }
  }
}