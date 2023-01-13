const config = require("../config.json");
const inquirer = require("inquirer");
const chalk = require('chalk')
const path = require('path')
const utils = require("../utils/common");
const log = utils.log
const runCmd = {
    name: 'run',
    description: "工银司库前端项目: 1.打包 2.同步front-web",
    options: [
        {
            flags: '-p, --project <project>',
            description: '指明项目',
            defaultValue: 'tms'
        }
    ],
    action: (option) => {
        // 指定运行哪个项目的命令
        let projectName = option.project;
        let projectConfig, cmdConfig;
        let accountConfig = config.accounts[projectName];
        try {
            projectConfig = config.projectNameCmdMap[projectName];
            cmdConfig = require('../cmd-json/' + projectConfig["cmd"])

        } catch( err) {
            log.error('配置文件有误')
        }
        if ( projectConfig && cmdConfig) {
            let choices = cmdConfig["run"];
            let checkBox = {
                type: 'checkbox',
                name: 'scripts',
                message: '请选择操作: ',
                choices
            }

            inquirer.prompt([checkBox]).then( answers => {
                let arr = []
                let scripts = answers.scripts;
                let projectName = path.basename(path.resolve('./'))
                log.on("当前项目为: " + projectName)
                scripts.forEach( script => {
                    let cmds = cmdConfig[script]
                    cmds.forEach( c => {
                        if (c.auth) {
                            let _script = parseAuthContent(accountConfig, c.script);
                            c.script = _script
                        }
                    })
                    // 打包操作
                    if (script === 'build') {
                        let moduleArr = projectName.split('-');
                        let moduleName = moduleArr[moduleArr.length -1]
                        cmds.forEach( c => {
                            c.script += moduleName
                        })
                    }
                    // 如果执行的是同步操作, 最后自动设置一下git地址
                    if (script === 'sync') {
                        let prefixUrl = parseAuthContent(accountConfig, cmdConfig['syncRemoteUrlPrefix'])
                        let item = {
                            name: '设置项目git: ' + `${prefixUrl}${projectName}.git`,
                            script: `${prefixUrl}${projectName}.git`
                        }
                        cmds.push(item)
                    }
                    arr = arr.concat(cmds)
                })
                utils.execScripts(arr)
            })
        } else {
            log.error(`当前不存在项目[${chalk.red(projectName)}]的配置内容, 请配置后重试`)
        }
    }
}

/**
 * 替换传入内容中的账号密码
 * @param accountConfig
 * @param content
 */
function parseAuthContent(accountConfig, content) {
    let result = content.replaceAll('$account', accountConfig.account)
    result = result.replaceAll('$password', accountConfig.password);
    return result
}

module.exports = runCmd
