// 提交前用默认配置覆盖config.json
const chalk = require("chalk")
const localConfig = require("../config.default.json");
const { writeFileContent, log } = require('../utils/common')
writeFileContent('./config.json', JSON.stringify(localConfig, null, 4), (err) => {
    if (!err) {
        log.success(`已更新${chalk.yellow('config.json')}`)
    }
})
