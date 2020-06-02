const {
  apiError,
  apiSuccess,
  noItemError,
  noLoginError,
  cmdSuccess,
  shouldLog
} = require('./helpers')

const { isArr, toStr } = require('jsutils')
const { Logger } = require('KegLog')
const { executeCmd, spawnCmd, spawnProc } = require('KegProc')

/**
 * Calls the docker cli from the command line and returns the response
 * @function
 * @param {Object} params - arguments used to modify the docker api call
 * @param {Object} params.opts - optional arguments to pass to the docker command
 * @param {Object} params.asObj - Return the response as an unformatted string
 * @param {Object} params.errResponse - On an error calling docker, this will be returned.
 *                                      If errResponse is undefined, the current process will exit
 *
 * @returns {Array|string} - JSON array of items || stdout from docker cli call
 */
const dockerCli = async ({ opts, errResponse, log, skipError, format='', force }) => {
  const options = isArr(opts) ? opts.join(' ').trim() : toStr(opts)
  const useFormat = format === 'json' ? `--format "{{json .}}"` : format
  const useForce = force ? '--force' : ''

  const cmdToRun = `docker ${ options } ${ useForce } ${ useFormat }`.trim()

  log && Logger.spacedMsg(`  Running command: `, cmdToRun)

  const { error, data } = await executeCmd(cmdToRun)

  return error
    ? apiError(error, errResponse, skipError)
    : apiSuccess(data, format)

}

/**
 * Calls the docker cli with dynamic params
 * @function
 * @param {string} args - Arguments to make the docker cli call
 * @param {boolean} type - Type of docker cli call to make ( image, container )
 *
 * @returns {string|Array} - Response from the dockerCli command
 */
const dynamicCmd = async (args, type) => {
  // Ensure options are an array
  const opts = !args.opts ? [] : isArr(args.opts) ? args.opts : [ args.opts ]

  // Ensure the first option is image
  opts[0] !== type && opts.unshift(type)

  // run the docker cli command
  const res = await dockerCli({ ...args, opts })

  // Use the 1 index of options to get the container cmd
  return cmdSuccess(opts[1], res)
}

/**
 * Calls the docker remove command to remove a docker item
 * @function
 * @param {string} toRemove - Name or id of item to remove
 * @param {boolean} force - Should force remove the item
 *
 * @returns {void}
 */
const remove = ({ item, force, skipError, type='' }) => {
  return item
    ? dockerCli({
        force,
        skipError: skipError,
        opts: `${ type } rm ${ item }`.trim(),
      })
    : noItemError(`docker.remove`)
}

/**
 * Calls the docker login command to log into the passed int providerUrl
 * @function
 * @param {Object} creds - Credentials to log into a docker registry provider
 * @param {string} creds.providerUrl - The url used to log into the provider
 * @param {string} creds.user - User used to login to the provider
 * @param {string} creds.token - Auth token for the docker registry provider
 *
 * @returns {void}
 */
const login = async ({ providerUrl, user, token }) => {

  if(!providerUrl || !user || !token) noLoginError(providerUrl, user, token)

  // Use the --password-stdin to the token is not stored in the bash history
  const loginCmd = `echo ${ token } | docker login ${ providerUrl } --username ${user} --password-stdin`

  Logger.empty()
  Logger.info(`  Logging into docker provider "${ providerUrl }", with user "${ user }"`)
  Logger.empty()

  const { error, data } = await executeCmd(loginCmd)

  return error && !data
    ? apiError(error)
    : Logger.success(`  Docker ${ data }`)

}

/**
 * Pushes a local docker image to the docker provider base on the url
 * @function
 * @param {string} url - Url to push the image to
 *
 * @returns {void}
 */
const push = async url => {

  Logger.spacedMsg(`  Pushing docker image to url`, url)

  const { error, data } = await spawnProc(`docker push ${ url }`)

  return error && !data
    ? apiError(error)
    : Logger.success(`  Finished pushing Docker image to provider!`)
}

/**
 * Pulls a docker image from a provider to the local machine
 * @function
 * @param {string} url - Url to pull the image from
 *
 * @returns {void}
 */
const pull = async url => {

  Logger.spacedMsg(`  Pulling docker image from url`, url)

  const { error, data } = await spawnProc(`docker pull ${ url }`)

  return error && !data
    ? apiError(error)
    : Logger.success(`  Finished pulling Docker image from provider!`)

}

/**
 * Runs a raw docker cli command by spawning a child process
 * <br/> Auto adds docker to the front of the cmd if it does not exist
 * @function
 * @param {string} cmd - Docker command to be run
 * @param {string} args - Arguments to pass to the child process
 * @param {string} loc - Location where the cmd should be run
 *
 * @returns {*} - Response from the docker cli command
 */
const raw = async (cmd, args, loc) => {

  const { error, data } = await spawnProc(
    cmd.trim().indexOf('docker') === 0 ? cmd : `docker ${cmd}`,
    args,
    loc
  )

  error && !data
    ? apiError(error)
    : Logger.success(`  Finished running Docker CLI command!`)
  
  return data
}

module.exports = {
  dockerCli,
  dynamicCmd,
  login,
  pull,
  push,
  raw,
  remove
}