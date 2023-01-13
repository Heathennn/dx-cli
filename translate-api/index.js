const MD5 = require('./md5')
const config = require('../config.json')
let translateConfig = config.translate
const axios = require('axios')
const appid = translateConfig.account.appId; // appid
const key = translateConfig.account.key; // 密钥
let salt = (new Date).getTime();
var query = '';
// 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
let from = 'zh';
let to = 'en';
let str1 = appid + query + salt +key;
let sign = MD5(str1);

function genSign(options) {
  let str1 = appid + options.query + salt + key;
  let sign = MD5(str1);
  return sign
}

function translate(options) {
  return new Promise( (resolve, reject) => {
    axios({
      url: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
      method: 'get',
      params: {
        q: options.query,
        appid: appid,
        salt: salt,
        from: options.from || from,
        to: options.to || to,
        sign: genSign(options)
      }
    }).then( res => {
      resolve(res.data)
    }).catch( err => {
      reject('翻译失败')
    }).finally( () => {
    })
  })
}

module.exports = translate
