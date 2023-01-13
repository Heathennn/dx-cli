## 如何初始化
> npm link 后可以在全局任意目录使用
> 
> dx-cli根目录下执行

```
npm i

// link不加参数, 会添加到全局
npm link
```
### 如何使用

- dx 和 dx-cli 两个命令可以在全局任意目录下使用

- 查看版本号
```bash
dx -V
```
- 帮助
```bash
dx -h
```
- run命令
```nashorn js
dx run 
// 可视化操作
// 可以选择打包和同步web操作
// 注意使用前修改自己的git账号和密码
```
- 翻译单个文件
```bash
dx translate -f ./a/b/test.js
```
以上命令会在./a/b下生成翻译后的test-en.js文件

- 批量翻译
```bash
dx translate -d ./a/b
```
1. 以上命令会在./a/b下查找所有**zh-CN**文件夹
2. 然后在其同级目录下生成**en-US**文件夹及翻译后的同名js文件

ps: 默认翻译zh-CN下的第一个文件

### 翻译功能说明

> 此功能会调用百度翻译api, 个人高级用户(免费,实名认证即可)每月限量100万字符
> 
> 每秒最多10次请求 (经过次数10次请求会有个别请求不返回翻译结果, 目前设置为每秒7次)

[百度翻译注册地址](https://fanyi-api.baidu.com/manage/developer)

注册后 
1. 创建自己的应用 会生成appId和key
2. 开通文本翻译功能 开通后才能正常翻译

### 配置百度翻译appid和key
```bash
issfe set translate account.appId 你的appId
issfe set translate account.key 你的key
```

### 重新link
> 修改文件名/文件目录等操作时需要此操作

在dx-cli目录下执行
```bash
npm unlink dx
npm link --force
```
或
前往C:\Users\issuser\AppData\Roaming\npm中手动把自己的命令删除

### dx-cli运行常见报错解决

- 环境: windows10

```bash
dx: 无法加载文件 C:\Users\issuser\AppData\..\npm\dx.ps1因为此系统上禁止运行脚本
```

解决办法: 
```bash
// 1. 以管理员身份运行powershell
// 修改执行策略
set-ExecutionPolicy RemoteSigned
// 改完后重试issfe命令
```

