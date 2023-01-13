#!/usr/bin/env node
const commander = require('commander');
const pkg = require('./package.json')
const runCmd = require('./command/run')
const translateCmd = require('./command/translate')
const setCmd = require('./command/set')
const emoji = require('./utils/emoji')
const { registerCommand } = require('./command/index')
const { log } = require('./utils/common')
const program = new commander.Command()
log.fly(`dx-cli`)
program.usage('<command> [options]')
program.version(pkg.version)

// 全局配置
registerCommand(program, setCmd)
// 1. 打包  2. 同步web
registerCommand(program, runCmd)
// 翻译功能
registerCommand(program, translateCmd)


program
.arguments('<cmd> [options]')
.description('=====')
.action(function (cmd, a) {
    console.log('=====')
})


program.parse(process.argv);

