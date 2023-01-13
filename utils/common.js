const shell = require("shelljs");
const fs = require('fs')
const emoji = require('./emoji')
const Utils = {
    /**
     * 运行命令
     * @param cmds [{name: 'xxx', script: 'cd /a/b/c'}]  name为打印日志  script为执行命令
     * @param path 指定路径, 不指定时直接在当前目录下运行
     */
    execScripts: function execScripts(cmds, path) {
        // 没传路径, 直接在当前目录下执行
        if(!path) {
            cmds.forEach( item => {
                console.log(`${emoji.on}  正在进行[${item.name}]`)
                if (shell.exec(item.script).code !== 0) {
                    exit(1)
                }
            })
        }
    },

    /**
     * 写入文件
     * @param filePath 文件路径
     * @param fileContent 文件内容
     * @param onFinally 完成时回调
     */
    writeFileContent: (filePath, fileContent, onFinally) => {
        fs.writeFile(filePath, fileContent, 'utf-8', (error, data) => {
            if (!error) {
                // console.log(`- 写入[${filePath}]成功`)
                // console.log(`- 已写入[${filePath}]`)
                onFinally && onFinally()
            } else {
                console.log(`- 写入${filePath}文件失败, 请重试`, error)
                onFinally && onFinally(error)
            }
        })
    },
    log: {
        ...genLogOptions()
    }
}


function genLogOptions()  {
    let options = Object.keys(emoji);
    let logFns = {}
    options.forEach( key => {
        logFns[key] = (info) => {
            console.log(`${emoji[key]}  ` + info)
        }
    })
    return logFns
}


module.exports = Utils
