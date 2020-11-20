
const { existsSync, readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')
const { checkCall } = require('@keg-hub/jsutils')
const homDir = require('os').homedir()

/**
 * Gets default shell profile path
 *
 * @returns {string} profile path
 */
const getProfilePath = () => {
  return /^win/gi.test(process.platform)
    ? console.error(`This script does not work with windows machine`)
    : existsSync(resolve(homDir, '.bash_profile'))
      ? resolve(homDir, '.bash_profile')
      : existsSync(resolve(homDir, '.bashrc'))
        ? resolve(homDir, '.bashrc')
        : existsSync(resolve(homDir, '.zshrc'))
          ? resolve(homDir, '.zshrc')
          : checkCall(() => {
              const profiles = ['.profile', '.bashrc', '.bash_profile', '.zshrc']
              return profiles.map(it => resolve(homDir, it))
                .find(it => existsSync(it))
            })
}

/**
 * Cleans a line, and removes comment prefix for a shell profile file
 *
 * @returns {string} cleaned line
 */
const cleanLine = line => {
  let clean = line.trim()
  clean = clean.indexOf('# ') === 0 ? clean.replace('# ', '').replace('#', '') : clean
  clean = clean.indexOf('#') === 0 ? clean.replace('#', '') : clean

  return clean
}

/**
 * Loads the default profile for a shell
 * <br/>Checks if it has the keg-cli already added and adds it if needed
 *
 * @returns {void}
 */
const addToProfile = (kegCLIPath) => {
  if(!writeFileSync) return console.error(`Keg-CLI path required to update shell profile!`)

  const profilePath = getProfilePath()
  if(!profilePath) return console.error(`Can not find profile for current shell!`)

  const profileContext = readFileSync(profilePath, 'utf8')
  const hasCLI = profileContext.split('\n')
  .reduce((hasCli, _line) => {
    if(hasCli) return hasCli

    const line = cleanLine(_line)
    return line.indexOf('source') == 0 && line.indexOf('/keg-cli/keg') !== -1
      ? true
      : false

  }, false)

  if(hasCLI) return

  const writeContent = profileContext + `\nsource ${kegCLIPath}\n`
  writeFileSync(profilePath, writeContent, 'utf8')

  console.log(`Shell profile updated with keg-cli!`)

}

module.exports = {
  addToProfile
}

