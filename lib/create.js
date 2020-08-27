const spawn = require('cross-spawn')
const ora = require('ora')
const { chalk } = require('@vue/cli-shared-utils')
const path = require('path')
const shell = require('shelljs')

function getTemplateURL(type) {
  return {
    node: 'https://github.com/lidasong/create-node-api.git',
    saber: 'git@gitlab.zhejianglab.com:bladex/Saber.git'
  }[type]
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
  const spinner = ora(`${chalk.cyan('install the app\'s dependencies at ' + name)}`).start()
  try {
    shell.cd(name)
    shell.exec('yarn install')
    spinner.succeed('install ready, you can run your app now')
  } catch (err) {
    spinner.fail('install failed')
    throw err
  }
}

module.exports = { fetchRemote, installDeps }
