const { Logger } = require('KegLog')
const { getTask } = require('./getTask')
const { validateTask } = require('./validateTask')
const { get, isFunc, isObj } = require('@keg-hub/jsutils')
const { parseArgs } = require('KegUtils/helpers/parseArgs')
const { GLOBAL_CONFIG_PATHS } = require('KegConst/constants')
const { hasHelpArg } = require('KegUtils/helpers/hasHelpArg')
const { injectService } = require('../services/injectService')
const { TAP_LINKS } = GLOBAL_CONFIG_PATHS

/**
 * Gets the custom tasks from the tap
 * @function
 * @param {Object} args.globalConfig - Global CLI config
 * @param {Object} args.tasks - All CLI registered tasks
 * @param {string} args.command - Command to run
 * @param {Array} args.options - Command options passed in from the command line
 * @param {string} tasksPath - Path to the task index file 
 *
 * @returns {Object} - Found custom tasks
 */
const getCustomTasks = async (args, taskFile) => {
  try {
    const loaded = require(taskFile)
    const tasks = isFunc(loaded)
      ? await loaded(args)
      : loaded

    return { ...args.tasks, ...tasks }

  }
  catch(err){

    Logger.empty()
    Logger.warn(`Error loading custom tasks from path ${taskFile}`)
    Logger.error(err.message)
    Logger.empty()

    process.exit(1)
  }
}

/**
 * Checks if the command is a linked tap, and if so, calls the tap command on that tap
 * @function
 * @param {Object} globalConfig - Global CLI config
 * @param {Object} tasks - All CLI registered tasks
 * @param {string} command - Command to run
 * @param {Array} options - Command options passed in from the command line
 *
 * @returns {Object} - Found task and options
 */
const checkLinkedTaps = async (globalConfig, tasks, command, options) => {

  const tapObj = get(globalConfig, `${ TAP_LINKS }.${ command }`)

  // If no tap path was found, we have no task, so just return
  if(!tapObj || !tapObj.path) return false

  // Load in the injected tasks
  const allTasks = !tapObj.tasks
    ? tasks
    : await getCustomTasks({
        globalConfig,
        tasks,
        command,
        options
      }, tapObj.tasks)

  // Create a copy of the options so we don't modify the original
  options = [ ...options ]

  // Call getTask, and set the command to be tap
  const taskData = getTask(allTasks, 'tap', ...options)

  // Get the params now instead of in executeTask
  // This way we can make all tap modification in one place
  taskData.params = await parseArgs({
      ...taskData,
      command,
      params: { tap: command }
    }, globalConfig)

  // Add the tap as the second-to-last option incase last option is the help option
  taskData.options.splice(taskData.options.length - 1, 0, `tap=${ command }`)

  // Check if the tap task allows injection
  // If it does, try to load the taps container folder and inject it
  return !get(taskData, 'task.inject')
    ? taskData
    : await injectService({
        taskData,
        app: command,
        injectPath: tapObj.path,
      })
}

/**
 * Gets the task from available tasks, If no task is found, checks if command is a tap
 * @function
 * @param {Object} globalConfig - Global CLI config
 * @param {Object} tasks - All CLI registered tasks
 * @param {string} command - Command to run
 * @param {Array} options - Command options passed in from the command line
 *
 * @returns {Object} - Found task and options
 */
const findTask = async (globalConfig, tasks, command, options) => {

  // First check if the cmd is for a linked task
  const tapTaskData = await checkLinkedTaps(globalConfig, tasks, command, options)
  
  // Get the task from available tasks
  const foundTask = tapTaskData || getTask(tasks, command, ...options)

  // Ensure we have the taskData
  const taskData = get(foundTask, 'task') ? foundTask : {}

  // Validate the task, and return the taskData
  return validateTask(
    taskData.task,
    null,
    hasHelpArg(options[ options.length -1 ]),
  ) && taskData

}

module.exports = {
  findTask
}
