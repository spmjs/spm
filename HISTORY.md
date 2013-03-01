## 2013 3.1 spm 1.7.0

重点: **css 项目模块的支持**
------

✔ 已完成 ➠ 进行中

### 待讨论确定

### 新功能
- ✔ #581 spm build 中 css模块的处理规则
- ✔ #584 spm css 模块的简单依赖分析处理
- ✔ #594 spm 增加 grunt 支持。 目前只是简单整合，后续会更加深度的整合。
- ✔ #641 在 JS 中依赖 alice 模块的支持
- ✔ #643 stylus 支持

### 改进
- ✔ #598 优化插件的扩展

## 2013.1.11, Version 1.6.0 (stable)

### 注意
1. 模块版本的命令参数由 **version** 改为 **ver**
2. 命令参数如果是 **aa-bb** 的形式，那么对应的 spmConfig 需要是 **aaBb** 的形式

### 新功能
- ✔ #577 Wrapped cmd modules 支持

### 非兼容式修改
- ✔ #576 spm 命令行参数 output 格式修改
- ✔ #572 spm 命令行参数相关重构。从 optimist 改为了 commander

### 优化增强
- ✔ #446 优化日志信息
- ✔ #580 spm deploy 支持没有配置的本地部署
- ✔ #583 coffee-script 升级到 1.4.0

### Bug Fix
- ✔ #588 build CoffeeScript 模块时出现错误
- ✔ #574 require 链式操作时，替换错误 
- ✔ #573 纯object的cmd模块依赖打包错误
- ✔ #571 spm deploy --to=xxx 失败


## 2013.1.4, Version 1.5.2 (stable)
### 新特性 & 优化增强
- ✔ #565 spm install 支持模板变量的检查

### Bug Fix
- ✔ #563 关于spm build的一个奇怪的bug

## 2012.12.31, Version 1.5.1 (stable)

### 新特性 & 优化增强

- ✔ #559 重新整理 spm transport 文档
- ✔ #555 本地server与线上源的同步功能
- ✔ #551 spm transport 优化

## 2012.12.28, Version 1.5.0 (stable)
### 新功能
- ✔ #550 增加 build-config 参数，允许用户指定打包的配置文件
- ✔ #548 spm 支持 id 解析模板变量功能
- ✔ #537 spm 增加预合并支持
- ✔ #536 spm 增加 json 模块处理插件 
- ✔  #528 用户自定义生命周期和插件的预加载

### 非兼容式修改

### 优化增强

- ✔ #543 模块名包含 **.** 的处理
- ✔ #530 spm 项目模型构造流程重构

### Bug Fix
- ✔ #545 spm 压缩参数配置支持 Node 调用
- ✔ #540 依赖替换出错
- ✔ #535 spm install from参数无效
- ✔ #532 spm 在 build 时候处理引入的模版时出错
- ✔ #523 通过with-debug控制xxx-debug.js文件的生成无效

## 2012.12.21, Version 1.4.0 (stable)
### 待讨论确定
-  ✔ #508 依赖传递模块的过滤
-  ✔ #507 spm deploy 功能升级 

### 非兼容式修改

### 优化增强
-  ✔ #509 spm 通过程序调用时，options 需要支持更多的内容
- ✔ #518 增加插件过滤机制 
- ✔ #520 增加 seajs 辅助功能模块
- ✔ #524 spm build 支持批处理 


### Bug Fix
-  ✔ #512 Node中调用SPM,配置idRule无效果 
- ✔ #513 spm output 配置为空的检测

## 2012.12.16, Version 1.3.0 (stable)

### 优化增强
- ✔ #495 spm upload 增加上传模块成功提示
- ✔ #499 升级 uglifyjs 模块 

### Bug Fix
- ✔ #489 spm init 模板错误
- ✔ #494 spm upload 的时候，在判断模块状态时，只判断符合当前源配置 roots 的源
- ✔ #503 spm upload 新模块时，忽略 stable 的检查
- ✔ #502 怎么配置私有源？


## 2012.12.09, Version 1.2.0 (stable)
### 新特性 & 优化增强

- ✔ #359 spm init 模板系统设计
- ✔ #382 查询源中指定类型模块列表 
- ✔ #399 spm transport 的一些优化
- ✔ #408 spm timeout 的设置
- ✔ #429 spm 配置文件中 id 书写规则
- ✔ #432 spm sources 重构
- ✔ #438 spm 本地缓存目录调整
- ✔ #434 spm 打包产生的 tgz 包支持额外的资源加载
- ✔ #442 spm 命令行参数和 spmConfig 配置的转换
- ✔ #449 spm upload 规则完善与功能增强
- ✔ #450 spm server 源服务增加模块状态和类别管理
- ✔ #458 spm 模块编译时配置文件合并规则梳理
- ✔ #459 线上文件发布状态检测插件
- ✔ #460 更新 SeaJS 1.3.1 到 modules.spmjs.org
- ✔ #464 源配置文件调整
- ✔ #465 所有标准模块必须包含 root 属性
- ✔ #466 spm 更新时，也更新配置
- ✔ #470 完善 output 中相对模块的判定规则
- ✔ #472 spm install 支持从 github repo 安装模块
- ✔ #476 请问在package.json里面的dependencies能不能像idRule一样使用例如{{root}}或者{{version}}这样的占位符？
- ✔ #477 spm 支持多个代理源 
- ✔ #478 spm upload 支持模块同源检查和模块上传路由 
- ✔ #481 spm search 时，无效信息太多
- ✔ #485 关于 info.json 的获取
- ✔ #486 增加 spm publish 方法
- ✔ #487 spm sources 增加 stable 字段的输出

### Bug Fix
- ✔ #443 spm install 缓存的问题
- ✔ #471 spm install 依赖重复检查
- ✔ #483 使用 --base 指定模块根路径时出错
- ✔ #443 spm install 缓存的问题

## 2012.11.14, Version 1.1.0 (stable)
- ✔ 模板系统初步成型，支持源模板配置。
- ✔ spm search 目前相对功能还比较简单。
- ✔ 修复社区反馈相关问题。

## 2012.10.27, Version 1.0.0 (stable)
- ✔ 修复社区反馈的问题
- ✔ 文档部分优化
- ✔ 提供了一个 hello-spm demo
- ✔ 只是 spmConfig 配置


## 2012.09.29 , Version 0.9.12(Unstable)

这个版本将是1.0之前最后的一个测试版本，在国庆后的第一周正式发布1.0
这个版本主要进行了一些bugfix, 还有根据社区的反馈增加了部分接口。

详情可以查看 https://github.com/seajs/spm/issues?milestone=11&state=closed
关于新增接口的使用 可以参看  https://github.com/seajs/spm/wiki/Spm-%E5%91%BD%E4%BB%A4%E8%AF%A6%E8%A7%A3 

## 2012.09.21 , Version 0.9.11(Unstable)

SPM 0.9.11会在9月21号下班前发布，敬请关注. 

需要关注点:
- ✔ 增加了用户插件扩展机制，可以很方便的注入新功能 #293
- ✔ 对公司内部提供了zip打包和复杂的合并规则等功能

具体相信升级信息如下:

### 插件

- ✔ #307 新增复杂的合并规则
- ✔ #175 支持zip格式模块压缩包

### 优化增强
- ✔ #293 支持插件扩展.
- ✔ #308 引入clean-css来代替yuicompress
- ✔ #292 简化output配置
- ✔ #280 output 中数组合并支持全局模块
- ✔ #301 spm 打包涉及到的读写文件支持用户自定义编码.

### bug fix

- ✔ #305 用户首次install 报错.
- ✔ #300 日志信息拼写错误
- ✔ #297 css相关加载问题

### test case
- ✔ #284 spm build 命令行参数测试
- ⌛ #240 对于新提出的问题，增加测试进行验证，并开始逐步完善核心测试用例

### 文档
- ⌛ #168 目前把相关文档会陆续整理到wiki中


## 2012.09.14 , Version 0.9.10(Unstable)
SPM 0.9.10会在9月14号下班前发布，敬请关注. 

需要关注点:
- ✔ 完善相关文档，新增 [SPM 使用入门](https://github.com/seajs/spm/wiki/Spm-%E4%BD%BF%E7%94%A8%E5%85%A5%E9%97%A8)
- ✔ 核心代码命名调整等.
- ✔ bugfix.

具体相信升级信息如下:

### 插件

- ✔ #296 depsCheck 优化依赖冲突信息提示
- ✔ #285 #282 output 增加with-debug支持，可以自定义debug文件命名

### 优化增强
- ✔ #291 spm install 支持依赖下载.
- ✔ #287 命令行参数优化
- ✔ #281 parent属性多级支持

### bug fix

- ✔ #295 注释require替换。
- ✔ #290 spm transport无法使用
- ✔ #288 info.json的信息更新
- ✔ #286 build 嵌套目录处理


### test case
-  #240 对于新提出的问题，增加测试进行验证，并开始逐步完善核心测试用例

### 文档
- #168 目前把相关文档会陆续整理到wiki中

## 2012.09.07, Version 0.9.9(Unstable)

SPM 0.9.9会在9月7号下班前发布，敬请关注. 

需要关注点:
- ✔ 完善相关文档，会持续进行
- ✔ 支持了基于命令行参数的模块打包，能满足些基本的打包需求.
- ✔  源服务优化，增加了更多模块的信息收集

具体相信升级信息如下:

### 插件

- ✔ #274 output 资源输出增加glob支持.

### 优化增强
- ✔ #278 基于命令行的打包
- ✔ #276 模块上传到源中的信息注册
- ✔ #275 define函数支持对象
- ✔ #271 require.async的处理
- ✔ #159 spm search 基于源信息，返回查找模块的一些版本信息.

### bug fix

- ✔ #277 解析模块中的依赖的时候，注释的干扰处理.
- ✔ #269 #268 #267 require替换的一些问题
- ✔ #266 define上面如果有注释的话，解析错误


### test case
-  #240 对于新提出的问题，增加测试进行验证，并开始逐步完善核心测试用例

### 文档
- #168 目前把相关文档会陆续整理到wiki中

## 2012.08.31, Version 0.9.8(Unstable)

SPM 0.9.8会在8月31下班前发布，敬请关注. 

需要关注点:
- ✔ 对spm的命令执行做了重构，改造后build过程中的某个阶段可以单独选择执行. 而且对于部分插件也支持单独执行了. 
- ✔ package.json解析机制进行了修改,原有的是自动的查找上级目录的package.json作为parent,但是这样造成了潜在的不稳定性，所以目前增加了parent属性，来指定需要继承的配置.

具体相信升级信息如下:

### 插件

- ✔ #250 output excludes支持简单的通配符.
- ✔ #219 #262 #263 #264 对于compress, jshint, less, cofee这些功能比较独立的插件，可以单独执行.

### 优化增强
- ✔ #258 新加命令对源中模块信息完善. 对于`spm install, spm search` 进行支持
- ✔ #255 由于部分老用户有些功能依赖老的build, 目前对原有的build功能进行了部分恢复.
- ✔ #245 package.json解析规则修改.
- ✔ #244 action和plugin进行了梳理.
- ✔ #218 spm install 改为从用户配置的源中进行加载

### bug fix

- ✔ #251 --version, --dist 对于纯数字的支持
- ✔ #248 0.9.7遗留的bug
- ✔ #261 源服务解析root报错.

### test case
-  #240 对于新提出的问题，增加测试进行验证，并开始逐步完善核心测试用例


## 2012.08.24, Version 0.9.7(Unstable)

SPM 0.9.7会在8月24下班前发布，敬请关注，这个版本主要还是进行功能完善。
- ✔ 补充了build的一些场景的测试用例.
- ✔ 对日志输出进行了减少，查看相信DEBUG信息可以通过增加`-v`。

### 插件

- ✔ #237 output 支持复合对象，增加了模块过虑功能

### 优化增强
- ✔ #246 在命令行中支持自定义版本
- ✔ #243 源服务支持代理
- ✔ #241 对于指定的json配置文件，格式严格匹配.
- ✔ #238 增加了插件中的收集，并在help中进行提示.
- ✔ #236 optimist进行二次封装，方便使用.
- ✔ #235 root默认规则更改 
- ✔ #229 命令行提示完善，目前提示的信息更加全面
- ✔ #228 命令行参数的统一处理

### bug fix

- ✔ #239 对于不规则文件名的兼容性处理

### test case
-  #240 对于新提出的问题，增加测试进行验证，并开始逐步完善核心测试用例


## 2012.08.17, Version 0.9.6(Unstable)

### 插件
- ✔ #212 js模块中css的处理
- ✔ #98 less 支持
- ✔ #97 coffee 支持

### 优化增强
- ✔ #226 提供源代码和输出目录的参数
- ✔ #225 debug文件排除
- ✔ #223 全局配置文件中支持seajs.config内容读取
- ✔ #200 支持自定义版本
- ✔ #194 参数优化
- ✔ #177 增加parent配置
- ✔ #207 spm init windows平台下兼容.

### bug fix

- ✔ #222 windows平台下压缩的tar包的解压问题.
- ✔ #215 output替换插件 require正则替换问题.

## 2012.08.10, Version 0.9.5(Unstable)

### 优化增强
- ✔  #211 SPM开发环境初始化.
- ✔  #210 公用配置文件加载.
- ✔  #206 合并保留依赖的处理.
- ✔  #191, #201 插件的一些优化.
- ✔  #187 支持排除合并模块中的某些模块.
- ✔  #195 $处理
- ✔  #171 package.json增加插件配置.
- ✔  #194 build 参数整理

* Fix #203, #202 window下面的一些错误处理.

* Improvement #198 log输出信息优化.


## 2012.08.8, Version 0.9.4-1(Unstable)

* Fix #202, #203 windows下面用户目录获取不正确.


## 2012.08.06, Version 0.9.3(Unstable)

### bug fix

- ✔  #193 默认源改为公开源
- ✔  #190 log IO冲重定向问题.
- ✔  #89 新源目录初始化
- ✔  #188 自定义config.json位置.
