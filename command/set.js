const config = require("../config.json");
const inquirer = require("inquirer");
const path = require('path')
const utils = require("../utils/common");
const chalk = require("chalk");
const log = utils.log;
const setCmd = {
    name: 'set <configName> [payload...]',
    description: "设置全局config.json配置",
    options: [
    ],
    action: (configName, payload, cmd) => {
        let configItem = config[configName];
        if (configItem) {
            if (config.editableConfig.includes(configName)) {
                if (payload.length === 2) {
                    let key = payload[0]
                    let value= payload[1]
                    eval(`configItem.${key} = ${value}`)
                    // configItem[key] = value
                    let configContent = JSON.stringify(config, null, 4)
                    utils.writeFileContent(path.resolve(__dirname, '../config.json'), configContent, (err) => {
                        if (err) {
                            log.error('更新配置文件失败')
                        } else {
                            log.success('更新成功!')
                            process.exit(1)
                        }
                    })
                } else {
                    log.success(`设置配置项: issfe set <配置项key> <对象key> <对象value>`)
                    process.exit(1)
                }
            } else {
                log.error(`配置项[${chalk.red(configName)}]不允许修改`)
            }
        } else {
            log.error(`配置项[${chalk.red(configName)}]不存在`)
            process.exit(1)
        }
    }
}

module.exports = setCmd
