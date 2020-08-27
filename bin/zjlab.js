#!/usr/bin/env node

/**
 * vue-cli
 */
const { chalk, semver, execa, error } = require('@vue/cli-shared-utils')
const requiredVersion = require('@vue/cli/package.json').engines.node
const leven = require('leven')
const inquirer = require('inquirer')
const { templates } = require('../lib/config')
const del = require('del')
const { fetchRemote, installDeps } = require('../lib/create')

function checkNodeVersion(wanted, id) {
  if (!semver.satisfies(process.version, wanted, { includePrerelease: true })) {
    console.log(
      chalk.red(
        'You are using Node ' +
          process.version +
          ', but this version of ' +
          id +
          ' requires Node ' +
          wanted +
          '.\nPlease upgrade your Node version.'
      )
    )
    process.exit(1)
  }
}

checkNodeVersion(requiredVersion, '@vue/cli')

if (semver.satisfies(process.version, '9.x')) {
  console.log(
    chalk.red(
      `You are using Node ${process.version}.\n` +
        `Node.js 9.x has already reached end-of-life and will not be supported in future major releases.\n` +
        `It's strongly recommended to use an active LTS version instead.`
    )
  )
}

const fs = require('fs')
const path = require('path')
const slash = require('slash')
const minimist = require('minimist')

// enter debug mode when creating test repo
if (
  slash(process.cwd()).indexOf('/packages/test') > 0 &&
  (fs.existsSync(path.resolve(process.cwd(), '../@vue')) ||
    fs.existsSync(path.resolve(process.cwd(), '../../@vue')))
) {
  process.env.VUE_CLI_DEBUG = true
}

const program = require('commander')
const loadCommand = require('@vue/cli/lib/util/loadCommand')

program
  .version(`@vue/cli ${require('@vue/cli/package').version}`)
  .usage('<command> [options]')

program
  .command('create <app-name>')
  .description('create a new project powered by vue-cli-service')
  .option(
    '-p, --preset <presetName>',
    'Skip prompts and use saved or remote preset'
  )
  .option('-d, --default', 'Skip prompts and use default preset')
  .option(
    '-i, --inlinePreset <json>',
    'Skip prompts and use inline JSON string as preset'
  )
  .option(
    '-m, --packageManager <command>',
    'Use specified npm client when installing dependencies'
  )
  .option(
    '-r, --registry <url>',
    'Use specified npm registry when installing dependencies (only for npm)'
  )
  .option(
    '-g, --git [message]',
    'Force git initialization with initial commit message'
  )
  .option('-n, --no-git', 'Skip git initialization')
  .option('-f, --force', 'Overwrite target directory if it exists')
  .option('--merge', 'Merge target directory if it exists')
  .option('-c, --clone', 'Use git clone when fetching remote preset')
  .option('-x, --proxy', 'Use specified proxy when creating project')
  .option('-b, --bare', 'Scaffold project without beginner instructions')
  .option('-t, --template <template>', 'Template fro initializing project')
  .option('--skipGetStarted', 'Skip displaying "Get started" instructions')
  .action(async (name, cmd) => {
    const options = cleanArgs(cmd)

    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(
        chalk.yellow(
          "\n Info: You provided more than one argument. The first one will be used as the app's name, the rest are ignored."
        )
      )
    }
    // --git makes commander to default git to true
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true
    }

    let { template } = options
    if (template && !templates.includes(template)) {
      console.log(
        chalk.red(
          `the ${template} is not one of [${templates.join(',')}]` +
            `please set correct template`
        )
      )
      process.exit(1)
    }
    if (!template) {
      const choice = await inquirer.prompt([
        {
          name: 'template',
          type: 'list',
          message: 'which template you need?',
          choices: templates
        }
      ])
      template = choice.template
      if (template !== 'default') {
        await del(name)
        fs.mkdirSync(name)
        await fetchRemote(template, name)
        await del(`${name}/.git`)
        await installDeps(name)
        process.exit()
        return
      }
    }

    require('@vue/cli/lib/create')(name, options)
  })

program
  .command('add <plugin> [pluginOptions]')
  .description(
    'install a plugin and invoke its generator in an already created project'
  )
  .option(
    '--registry <url>',
    'Use specified npm registry when installing dependencies (only for npm)'
  )
  .allowUnknownOption()
  .action((plugin) => {
    require('@vue/cli/lib/add')(plugin, minimist(process.argv.slice(3)))
  })

program
  .command('invoke <plugin> [pluginOptions]')
  .description('invoke the generator of a plugin in an already created project')
  .option(
    '--registry <url>',
    'Use specified npm registry when installing dependencies (only for npm)'
  )
  .allowUnknownOption()
  .action((plugin) => {
    require('@vue/cli/lib/invoke')(plugin, minimist(process.argv.slice(3)))
  })

program
  .command('inspect [paths...]')
  .description('inspect the webpack config in a project with vue-cli-service')
  .option('--mode <mode>')
  .option('--rule <ruleName>', 'inspect a specific module rule')
  .option('--plugin <pluginName>', 'inspect a specific plugin')
  .option('--rules', 'list all module rule names')
  .option('--plugins', 'list all plugin names')
  .option('-v --verbose', 'Show full function definitions in output')
  .action((paths, cmd) => {
    require('@vue/cli/lib/inspect')(paths, cleanArgs(cmd))
  })

program
  .command('ui')
  .description('start and open the vue-cli ui')
  .option(
    '-H, --host <host>',
    'Host used for the UI server (default: localhost)'
  )
  .option(
    '-p, --port <port>',
    'Port used for the UI server (by default search for available port)'
  )
  .option('-D, --dev', 'Run in dev mode')
  .option('--quiet', `Don't output starting messages`)
  .option('--headless', `Don't open browser on start and output port`)
  .action((cmd) => {
    checkNodeVersion('>=8.6', 'vue ui')
    require('@vue/cli/lib/ui')(cleanArgs(cmd))
  })

program
  .command('init <template> <app-name>')
  .description(
    'generate a project from a remote template (legacy API, requires @vue/cli-init)'
  )
  .option('-c, --clone', 'Use git clone when fetching remote template')
  .option('--offline', 'Use cached template')
  .action(() => {
    loadCommand('init', '@vue/cli-init')
  })

program
  .command('config [value]')
  .description('inspect and modify the config')
  .option('-g, --get <path>', 'get value from option')
  .option('-s, --set <path> <value>', 'set option value')
  .option('-d, --delete <path>', 'delete option from config')
  .option('-e, --edit', 'open config with default editor')
  .option('--json', 'outputs JSON result only')
  .action((value, cmd) => {
    require('@vue/cli/lib/config')(value, cleanArgs(cmd))
  })

program
  .command('outdated')
  .description('(experimental) check for outdated vue cli service / plugins')
  .option('--next', 'Also check for alpha / beta / rc versions when upgrading')
  .action((cmd) => {
    require('@vue/cli/lib/outdated')(cleanArgs(cmd))
  })

program
  .command('upgrade [plugin-name]')
  .description('(experimental) upgrade vue cli service / plugins')
  .option(
    '-t, --to <version>',
    'Upgrade <package-name> to a version that is not latest'
  )
  .option(
    '-f, --from <version>',
    'Skip probing installed plugin, assuming it is upgraded from the designated version'
  )
  .option(
    '-r, --registry <url>',
    'Use specified npm registry when installing dependencies'
  )
  .option('--all', 'Upgrade all plugins')
  .option('--next', 'Also check for alpha / beta / rc versions when upgrading')
  .action((packageName, cmd) => {
    require('@vue/cli/lib/upgrade')(packageName, cleanArgs(cmd))
  })

program
  .command('migrate [plugin-name]')
  .description(
    '(experimental) run migrator for an already-installed cli plugin'
  )
  // TODO: use `requiredOption` after upgrading to commander 4.x
  .option(
    '-f, --from <version>',
    'The base version for the migrator to migrate from'
  )
  .action((packageName, cmd) => {
    require('@vue/cli/lib/migrate')(packageName, cleanArgs(cmd))
  })

program
  .command('info')
  .description('print debugging information about your environment')
  .action((cmd) => {
    console.log(chalk.bold('\nEnvironment Info:'))
    require('envinfo')
      .run(
        {
          System: ['OS', 'CPU'],
          Binaries: ['Node', 'Yarn', 'npm'],
          Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
          npmPackages: '/**/{typescript,*vue*,@vue/*/}',
          npmGlobalPackages: ['@vue/cli']
        },
        {
          showNotFound: true,
          duplicates: true,
          fullTree: true
        }
      )
      .then(console.log)
  })
program.command('serve').description('serve development')
program.command('build').description('build bundle files for production')
// output help information on unknown commands
program.arguments('<command>').action((cmd) => {
  program.outputHelp()
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
  console.log()
  suggestCommands(cmd)
})

// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(
    `  Run ${chalk.cyan(
      `zjlab <command> --help`
    )} for detailed usage of given command.`
  )
  console.log()
})

program.commands.forEach((c) => c.on('--help', () => console.log()))

// enhance common error messages
const enhanceErrorMessages = require('@vue/cli/lib/util/enhanceErrorMessages')

enhanceErrorMessages('missingArgument', (argName) => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', (optionName) => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return (
    `Missing required argument for option ${chalk.yellow(option.flags)}` +
    (flag ? `, got ${chalk.yellow(flag)}` : ``)
  )
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

function suggestCommands(unknownCommand) {
  const availableCommands = program.commands.map((cmd) => cmd._name)

  let suggestion

  availableCommands.forEach((cmd) => {
    const isBestMatch =
      leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand)
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`))
  }
}

function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd) {
  const args = {}
  cmd.options.forEach((o) => {
    const key = camelize(o.long.replace(/^--/, ''))
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}

/**
 * cli-service
 */

const Service = require('@vue/cli-service/lib/Service')
const service = new Service(process.env.VUE_CLI_CONTEXT || process.cwd())

const rawArgv = process.argv.slice(2)
const args = require('minimist')(rawArgv, {
  boolean: [
    // build
    'modern',
    'report',
    'report-json',
    'inline-vue',
    'watch',
    // serve
    'open',
    'copy',
    'https',
    // inspect
    'verbose'
  ]
})
const command = args._[0]
if (['serve', 'build'].includes(command)) {
  service.run(command, args, rawArgv).catch((err) => {
    error(err)
    process.exit(1)
  })
}