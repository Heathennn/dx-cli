const config = require("../config.json");
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const { log } = require('../utils/common')
const translate = require('../translate-api/index')
const translateConfig = config.translate
const translateCmd = {
    name: 'translate',
    description: "中译英功能,支持批量和单个文件翻译",
    // options: ['-l, --language <language>', '转换为什么语言, 支持[zh]和[en]', 'en'],
    options: [
        {
            flags: '-l, --language <language>',
            description: '转换为什么语言, 支持[zh]和[en]',
            defaultValue: 'en'
        },
        {
            flags: '-f, --file <file>',
            description: '转换文件的路径',
            defaultValue: null
        },
        {
            flags: '-d, --dir <dirpath>',
            description: '转换文件夹的路径',
            defaultValue: null
        }
    ],
    action: async (option) => {
        let filePath = option.file;
        let dirPath = option.dir;

        if (!filePath && !dirPath) {
            log.error(`${chalk.red('未携带参数')}`)
            log.check(`${chalk.yellow('-f ./a/b/xxx.js')} 指明要翻译的js文件; 如a.js 生成在同级目录下 a-en.js`)
            log.check(`${chalk.yellow('-d ./a ')} 指明要翻译文件夹; 默认会查找指定目录下所有zh-CN文件夹, 并翻译其内第一个文件, 输出同名文件于zh-CN文件夹同级的en-US文件夹下`)
            process.exit(1)
        }
        // 有文件夹路径时忽略文件
        if (dirPath) {
            let stat = fs.statSync(dirPath);
            if (!stat.isDirectory()) {
                return log.error(`${chalk.red(dirPath)}不是一个文件夹!`)
            } else {
                let filePaths = []
                getAllFilePaths(dirPath, filePaths)
                log.success(`共找到${chalk.red(filePaths.length)}个要翻译的文件`)
                if (filePaths.length) {
                    execWorkerSync(filePaths, 0)
                } else {
                    log.success(`Exit`)
                }
            }
        } else {
            let file_content = await readAndTranslateFileContent(filePath);
            let fileName = path.basename(filePath);
            let dirPath = path.dirname(filePath);
            let newFileName =  fileName.split('.')[0] + `-${option.language}.` + fileName.split('.')[1];
            let newFilePath = dirPath + '/' + newFileName;
            writeFileContent(newFilePath, file_content)
        }
    }
}


/**
 * 递归处理i18n配置对象
 * @param config i18n配置js 一般为langs文件下的js文件
 * @description 把js对象处理成 [ { keys: ['common', 'title'], value: '要翻译的值'} ]  每个要翻译的中文为一个item keys表示他在对象里的位置
 */
function parseConfigs(config) {
    let words = []

    parseConfig(config, null)
    function parseConfig(config, curItem) {
        let keys = Object.keys(config);
        keys.forEach( key => {
            let item = {
                keys: curItem ? curItem.keys.concat([key]) : [key],
                value: config[key]
            }
            // 对象的value为string时则为要翻译的值
            if (typeof item.value === 'string') {
                words.push(item);
            } else {
                parseConfig(item.value, item)
            }
        })
    }
    return words;

}

/**
 * 把所有要翻译的词分组 每秒有查询次数限制
 * @param words 处理好的数据
 * @param limitLength 每秒查几个词
 * @returns {*[]} 处理后的二维数组
 */
function limitWords(words, limitLength=7) {
    let wordsLimit = []
    if (words.length < limitLength) {
        return [words]
    } else {
        for( let i = 0; i < words.length; i += limitLength) {
            wordsLimit.push(words.slice(i, i + limitLength))
        }
        return wordsLimit
    }
}

/**
 * 调用翻译功能
 * @param limitedWords 分组后的word数据
 * @param cb 全部翻译结束后的回调函数
 */
function startTranslate(limitedWords, cb) {
    let curIndex = 0;
    let timer = null;
    timer = setInterval(() => {
        if (curIndex >= limitedWords.length) {
            clearInterval(timer);
            cb && cb()
        } else {
            // console.log('当前执行index: ', limitedWords[curIndex])
            limitedWords[curIndex].forEach( async word => {
               let res = await translate({ query: word.value, from: 'zh', to: 'en'} ).catch( err => {
                    console.log(err)
                })

                let translate_result = res.trans_result ? res.trans_result[0].dst : word.value
                word.value = translate_result;
            })
            curIndex++
        }
    }, 1000)
}

/**
 * 组装翻译后的数据结构
 * @param words
 * @param obj
 */
function setTranslatedObj(words, obj) {
    words.forEach( item => {
        item.keys.forEach( (key, index) => {
            if (index === 0) {
               if (!obj[key]) obj[key] = {}
            } else if (index < item.keys.length - 1) {
                // a.b.c
                let _key = item.keys.slice(0, index+1).join('.')
                let flag = false;
                eval(`flag = !!!obj.${_key}`)
                if (flag) eval(`obj.${_key} = {}`)
            } else {
                let _key = item.keys.slice(0, index+1).join('.')
                eval(`obj.${_key} = "${item.value}"`)
            }
        })
    })
}

/**
 * 读取并翻译文本内容
 * @param filePath 文件地址
 * @param cb 翻译后的回调
 * @return 翻译后的文本
 */
function readAndTranslateFileContent(filePath, cb) {
    return new Promise( (resolve, reject) => {
        fs.readFile(filePath, { encoding: 'utf8'}, (err, data) => {
            if (err) {
                log.error('读取文件失败')
                reject();
            } else {
                let jsonObj;
                let fileData = data.toString();
                let startIndex = fileData.indexOf('{')
                let endIndex = fileData.lastIndexOf('}')
                let jsonStr = fileData.slice(startIndex, endIndex === fileData.length ? endIndex : endIndex + 1);
                try {
                    // 当成js执行
                    eval('jsonObj = ' + jsonStr)
                } catch( err) {
                    jsonObj = null;
                    log.error('文件解析失败');
                    reject();
                }

                if (jsonObj) {
                    let obj = {}
                    let words = parseConfigs(jsonObj);
                    let limitedWords = limitWords(words, 7);
                    log.on(`正在翻译${chalk.yellow(filePath)}`)
                    startTranslate(limitedWords, () => {
                        let words_result = limitedWords.flat(1);
                        setTranslatedObj(words_result, obj)
                        let file_result = `export default ` + JSON.stringify(obj, null, 4)
                        resolve(file_result)
                    })
                }
            }
        })
    })
}

/**
 * 写入文件
 * @param filePath 文件路径
 * @param fileContent 文件内容
 * @param onFinally 完成时回调
 */
function writeFileContent(filePath, fileContent, onFinally) {
    fs.writeFile(filePath, fileContent, 'utf-8', (error, data) => {
        if (!error) {
            // console.log(`- 写入[${filePath}]成功`)
            log.success(`已写入${chalk.yellow(filePath)}`)
            onFinally && onFinally()
        } else {
            console.log(error)
            log.error(`写入${chalk.red(filePath)}文件失败, 请重试`)
            onFinally && onFinally()
        }
    })
}

/**
 * 获取所有需要处理的文件路径+目标路径
 * @param dirPath 从指定的目录地址开始查找
 * @param filePaths 一个空数组，用来接收结果
 */
function getAllFilePaths(dirPath, filePaths) {
    let files = fs.readdirSync(dirPath)
    files.forEach( file => {
        let filePath = path.join(dirPath, file);
        let stats = fs.statSync(filePath);
        // 是否是文件夹
        let isDir = stats.isDirectory();
        if (isDir) {
            if (file === translateConfig.sourceDirName) {
                let files = fs.readdirSync(filePath)
                let jsPath = path.join(filePath, files[0])
                let targetPath = path.join(dirPath, translateConfig.targetDirName)
                filePaths.push({
                    sourcePath: jsPath,
                    targetPath
                })
            } else if (!translateConfig.dirBlackList.includes(file)) {
                getAllFilePaths(filePath, filePaths)
            }
        }
    })
}

/**
 * 同步执行所有翻译操作
 * 因为每秒请求数有限制, 异步请求会超过最大并发数
 * @param files 所有要翻译的文件
 * @param index 当前进行到的index
 */
async function execWorkerSync(files, index=0) {
    let fileItem = files[index]
    let file_content = await readAndTranslateFileContent(fileItem.sourcePath);
    let fileName = path.basename(fileItem.sourcePath);
    let newFilePath = fileItem.targetPath + '/' + fileName;
    let exist = fs.existsSync(fileItem.targetPath)
    // 自动创建不存在的目录
    if (!exist) {
        try {
            log.on(`创建文件夹${chalk.yellow(fileItem.targetPath)}`)
            fs.mkdirSync(fileItem.targetPath)
        } catch (error) {
            log.error(`创建文件夹${chalk.red(fileItem.targetPath)}失败`);
            process.exit(1)
        }
    }
    writeFileContent(newFilePath, file_content, () => {
        index++;
        if (index < files.length) {
            execWorkerSync(files, index)
        }
    })
}

module.exports = translateCmd
