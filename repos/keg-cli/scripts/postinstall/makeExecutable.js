const { promisify } = require('util')
const { exec } = require('child_process')
const cmdExec = promisify(exec)
const path = require('path')
const rootDir = path.join(__dirname, '../../')
const { addToProfile } = require('./addToProfile')

const cmdOpts = {
  groupID: process.getgid(),
  userID: process.getuid(),
  maxBuffer: Infinity,
  env: process.env,
  cwd: rootDir
}

/**
 * Runs the passed in command in a child process
 *
 * @returns {void}
 */
const runCmd = async command => {
  const { stderr } = await cmdExec(command, cmdOpts)
  // If there was an error throw it
  if (stderr) throw new Error(stderr)

  return true
}

/**
 * Removes the current files in the bin directory
 * <br/>Copies the root cli files into the bin directory
 * <br/>Then Ensure the cli index is executable
 *
 * @returns {void}
 */
const makeExecutable = async (rootDir, name) => {
  const kegCLIPath = path.join(rootDir, name)
  console.log(`Making file executable ...`)
  await runCmd(`chmod +x ${kegCLIPath}`)

  name === 'keg' && addToProfile(kegCLIPath) 
}

module.exports = {
  makeExecutable
}