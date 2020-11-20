const path = require('path')
const rootDir = path.join(__dirname, '../../')
const { makeExecutable } = require('./makeExecutable')

;(async () => {

  // Makes <root_dir>/keg executable
  await makeExecutable(rootDir, 'keg')

  // Makes <root_dir>/keg-cli executable
  await makeExecutable(rootDir, 'keg-cli')

})()