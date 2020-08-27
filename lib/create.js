const spawn = require('cross-spawn')
const ora = require('ora')
const { chalk, hasYarn } = require('@vue/cli-shared-utils')
const path = require('path')
const shell = require('shelljs')
const fs = require('fs')

function getTemplateURL(type) {
  return `git@gitlab.zhejianglab.com:templates/${type}.git`
}

async function fetchRemote(type, dir) {
  const templateURL = await getTemplateURL(type)
  const spinner = ora(`git clone the ${type} repo from ${templateURL}`).start()
  try {
    spawn.sync('git', ['clone', templateURL, dir])
    spinner.succeed('clone the repo')
  } catch (err) {
    spinner.fail('git clone the repo failed')
    throw err
  }
}

async function installDeps(name) {
  const spinner = ora(`${chalk.cyan('install the app\'s dependencies at ' + name)}\r\n`).start()
  try {
    await updatePkg({name})
    shell.cd(name)
    shell.exec(`${hasYarn() ? 'yarn' : 'npm install'}`)
    spinner.succeed('install ready, you can run your app now')
  } catch (err) {
    spinner.fail('install failed')
    throw err
  }
}

async function updatePkg({name}) {
  const pkgPath = path.resolve(process.cwd(),`${name}/package.json`)
  const packageJson = require(pkgPath)
  packageJson.name = name
  fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2), 'utf8')
}

module.exports = { fetchRemote, installDeps }
