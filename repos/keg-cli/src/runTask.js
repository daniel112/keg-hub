const Tasks = require('KegTasks')
const { get, isFunc, isObj } = require('@keg-hub/jsutils')
const { findTask, executeTask } = require('KegUtils/task')
const { throwExitError } = require('KegUtils/error')
const { hasHelpArg } = require('KegUtils/helpers/hasHelpArg')
const { showHelp } = require('KegLog')

/**
 * Runs a Keg CLI command
 *
 * @returns {Any} - Output of the executed task
 */
 const runTask = async (globalConfig) => {
  try {

    // Get the passed in arguments passed form the command line
    const [ command, ...args ] = process.argv.slice(2)

    // Load all possible tasks
    const cliTasks = Tasks(globalConfig)

    // If no command, or if the command is global help, then show help
    if(!command || hasHelpArg(command)) return showHelp({ tasks: cliTasks })

    // Get the taskData from available tasks
    const taskData = await findTask(globalConfig, cliTasks, command, args)

    // Run the task and get the response
    // Await the response to ensure the task completes before returning the response
    const response = await executeTask({
      ...taskData,
      command,
      globalConfig,
    })

    return response

  }
  catch(err){
    throwExitError(err)
  }
}

module.exports = {
  runTask,
}


