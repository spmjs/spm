# Static Package Manager - 简单、放心的包管理工具


## 安装

首先需要安装 node 和 npm: http://nodejs.org/#download

然后有两种安装方式:

### 通过 npm

```
$ sudo npm install spm -g
```

### 通过源码

```
$ git clone https://github.com/seajs/spm.git
```
```
$ cd spm
$ sudo npm install -g
```


## SPM 概要

目前我们的打包是基于配置文件，而且对模块的目录结构也有一定的要求，所以需要先了解下基本的目录结构和典型的配置文件。


### 目录结构约定

```
dist/
    example-debug.js
    example.js
examples/
src/
    example.js
tests/
package.json
README.md
```

其中 **dist** 目录存放的是我们打包好的模块，也就是最终上线使用的模块文件。


### 典型配置文件

```
{
    "name": "example",
    "version": "1.0.0",
    "dependencies": {
        "$": "$",
        "handlebars": "1.0.0",
        "base": "#base/0.9.16/base"
    },
    "output": {
        "name.js": ".",
        "name2.js": ['n1.js', 'n2.js']
    }
}
```

### dependencies 相关依赖解析

#### 相关写法

1. spm对于这种相等的模块，spm将不作处理，最终**$**的解析将有页面来决定.
2. 这种是```handlebars/1.0.0/handlebars```的一种简化形式
3. 是我们的标准配置.

#### 依赖查找
由于打包的时候我们需要计算依赖关系，所以我们根据用户配置的依赖需要找到具体的模块，我们目前是通过源来完成的，对于一些标准模块
我们会提供统一的源服务，而对于用户的一些私有模块，我们也提供了命令可以方便用户快速的搭建自己的私有源服务.后面也会有相关**源**的介绍.

### outout 模块输出配置.
目前支持多种写法，最常用的就是上面两种:

1. **"."** 会产生合并，其中会把name.js这个模块所有依赖的相对模块合并成一个模块**name.js**输出.
2. 也是合并，不过是按照用户数组定义的顺序进行文件合并.

总之SPM 目前说简单点就是根据模块的配置文件，然后计算模块的依赖，并替换相关依赖，并把需要的文件合并起来，然后输出标准的CMD模块. 

对于配置文件更详细的内容可以参看下面两个内容:

[package, sources and spm](https://github.com/seajs/spm/issues/148)

[配置文件详情](https://github.com/seajs/spm/wiki/package.json) 

对于具体的例子，可以参考我们已经开放出去的模块:

[aralejs](https://github.com/aralejs)

SPM 相关命令
---
目前我们的命令大概可以分为两类.

### 模块打包

#### spm build [options]

根据package.json的配置打包模块并输出到**dist**目录:

    $ spm build
其中有下面相关设置:

    -compiler=closure // 使用google closure compile 进行压缩

    -v --verbose // 打印debug信息, 方便调试

#### spm upload [options]

打包模块(build)，并把打包好后的dist目录的内容按照我们的定义上传到**源服务中** 方便其他人使用.

    $ spm upload 

其中**build**的参数也都适用，有一个新增加的：
    
    --only // 只进行上传，不会执行build操作.

#### spm deploy [options]

打包模块，并上传源服务，而且根据用户配置的远程服务器信息，可以把dist下面的内容**scp**到远程服务器.
具体的配置信息参看:

[spm deploy 基本介绍](https://github.com/seajs/spm/issues/173)

[spm deploy 相关讨论](https://github.com/seajs/spm/issues/181)

其中参数和upload的一致.


### 工具辅助

#### spm install [options] name[@version]

获取所有的 seajs 兼容新模块到当前目录.

    $ mkdir libs
    $ cd libs
    $ spm install all

也可以获取指定模块:

    $ spm install jquery@1.7.2

查看更多详情:

    $ spm help install

#### spm init

创建一个标准模块:

    $ mkdir module
    $ cd module
    $ spm init

可指定模块的 root，这个配置可查看 [package.json](https://github.com/seajs/spm/wiki/package.json)

    $ spm init -r alipay

#### spm transport [--force] transport.js

你可以通过 `transport` 去包装一些非标准模块:

    $ cd path/to/modules
    $ mkdir xxx
    $ cp jquery/transport.js xxx/
    $ vi xxx/transport.js  # modify it
    $ spm transport xxx/transport.js

### spm server [options] 

在当前目录启用源服务， 端口为 8000
    
    $ spm server -p 8000

这样使用者可以在内网部署此服务，可以把模块部署到此服务，其他用户也可以从这个服务获取里面的模块.

如果一个服务想对多个系统(也就是模块配置有不同的root)提供服务的话

    $ spm server -p 8001 --mapping



