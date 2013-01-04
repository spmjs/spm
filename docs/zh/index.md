# SPM 中文文档

-----------

SPM 是基于 nodejs 的静态文件管理工具，所以在安装 SPM 之前，你需要安装 node。通常来说，你应该已经安装好了 node，不过这里还是重复一下。

你可以在 [nodejs.org](http://nodejs.org/) 下载安装包安装，也可以通过包管理器（比如在 Mac 上用 homebrew，同时推荐在 Mac 上用 homebrew）。

安装完成后也许还需要设置环境变量 `NODE_PATH`，Linux & Mac 用户在自己的 shell 配置文件(.bash_profile | .bashrc | .zshrc)里设置，如

```
export NODE_PATH="/usr/local/share/npm/lib/node_modules"
```

具体的地址可能不是如上所示，请根据实际情况自行处理。另外也许还需要设置 PATH：

```
export PATH="$PATH:/usr/local/share/npm/bin"
```

Windows 用户也需要设置环境变量 NODE_PATH（如不知道在哪里设置，请自行[搜索](https://www.google.com/search?q=windows+%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)），一般来说设置为：

```
NODE_PATH = C:\Users\{{username}}\AppData\Roaming\npm\node_modules
```


## 安装

你已经安装好了 node，使用 node 提供的包管理工具 npm 来安装 SPM 很简单，只需要在终端里输入：

```
$ npm install spm -g
```

注意，一定要有 ``-g`` 哦，这样才能够在终端里调用到 spm。


## 使用指南

### 配置

### 模块

### 命令

## 开发者指南

以下内容针对开发者，如果仅仅只是使用 spm，请忽略这一节内容。
