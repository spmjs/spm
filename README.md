# Static Package Manager - 简单、放心的包管理工具

SPM 是一个基于命令行的前端项目管理工具，目前可以支持 JS 和 CSS 的项目。 目前 SPM 还在逐步完善中，如果大家在使用有 [问题](https://github.com/seajs/spm/issues?state=open) 或者发现 [BUG](https://github.com/seajs/spm/issues?state=open) 都可以提出来 

## 安装
首先保证你的机器已经安装了:

* [NodeJS](http://nodejs.org/#download)
  - versions: 0.8.x or later
* [npm](http://github.com/isaacs/npm)
* [Java](http://www.oracle.com/technetwork/java/javase/downloads/index.html) 可选，有些功能扩展需要使用到.

```
$ npm install -g spm
```

## SPM 基本功能介绍
---
目前我们的功能大概可以分为三类.

### 模块打包

#### spm build [options] 
对项目文件进行处理，并输出到指定目录. 这个可以说是 SPM 核心功能之一，具体的使用可以参看下面文档：
* [SPM build之默认目录结构](https://github.com/seajs/spm/wiki/SPM-build-%E4%B9%8B%E9%BB%98%E8%AE%A4%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)
* [SPM build之任意目录结构](https://github.com/seajs/spm/wiki/Spm-build-%E4%B9%8B%E8%87%AA%E5%AE%9A%E4%B9%89%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)
* [SPM build 详解](https://github.com/seajs/spm/wiki/SPM-build-%E8%AF%A6%E8%A7%A3)
* [SPM build 基于命令行参数打包详解](https://github.com/seajs/spm/wiki/SPM-build-%E5%9F%BA%E4%BA%8E%E5%91%BD%E4%BB%A4%E8%A1%8C%E5%8F%82%E6%95%B0%E6%89%93%E5%8C%85%E8%AF%A6%E8%A7%A3)
* [SPM build 合并详解](https://github.com/seajs/spm/wiki/SPM-build-%E5%90%88%E5%B9%B6%E6%A8%A1%E5%9D%97%E5%A4%84%E7%90%86%E7%9B%B8%E5%85%B3%E8%AF%B4%E6%98%8E)

#### spm upload [options]
打包项目，并上传到[源](https://github.com/seajs/spm/wiki/SPM-%E6%BA%90%E8%AF%A6%E8%A7%A3)中.

#### spm deploy [options]
打包项目，并上传源，而且根据用户配置进行代码部署. 

* [spm deploy 基本介绍](https://github.com/seajs/spm/issues/173)

* [spm deploy 相关讨论](https://github.com/seajs/spm/issues/181)


### 开发辅助

#### spm install [options] <root.>name[@version]

具体使用可以参看: https://github.com/seajs/spm/issues/218

#### spm init 
创建一个标准模块. 具体详情可以参看 https://github.com/seajs/spm/issues/153

#### spm transport [--force] transport.js 
你可以通过 `transport` 去包装一些非标准模块.
关于 **transport** 的使用可以参看 https://github.com/seajs/spm/issues/340

#### spm server [options] 
在当前目录启用源服务， 端口为 8000。 

```    
$ spm server -p 8000
```
这样使用者可以在内网部署此服务，可以把模块部署到此服务，其他用户也可以从这个服务获取里面的模块.
更多的内容可以参看 [SPM 源详解](https://github.com/seajs/spm/wiki/SPM-%E6%BA%90%E8%AF%A6%E8%A7%A3)

### 工具类
#### spm concat
合并文件， 目前此功能比较简单，就是简单的合并，和cat命令类似.

```
spm concat src/*.js --dest=all.js
```

#### spm min
压缩指定目录的内容并输出到指定的目录:

```
spm min src/*.js // 压缩src目录中的所有js, 并输出到dist目录
spm min src/**/*.js --dist=target // 压缩src目录中，并递归查询对应的子目录中的js文件，并输出到target目录

// 可以通过 dest启动压缩合并功能
spm min src/*.js --dest=all.js // 压缩src下面的所有文件，并合并产生all.js
```

#### spm lint
使用jshint检查指定目录的代码

```
spm lint src/*.js
spm lint src/**/*.js
```


> 更多的关于命令的操作，可以查看 [SPM 命令详解](https://github.com/seajs/spm/wiki/Spm-%E5%91%BD%E4%BB%A4%E8%AF%A6%E8%A7%A3)

## SPM 扩展
目前 SPM 已经支持了简单的用户扩展机制，详情查看: [SPM 插件扩展](https://github.com/seajs/spm/issues/153)




