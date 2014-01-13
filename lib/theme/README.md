# Theme for CMD modules Documentation

---

这是一个为 [spmjs.org](http://spmjs.org) 中模块的静态文档设计的 [nico](http://lab.lepture.com/nico/) 主题。


## 安装


### 1. 安装 node

请自己安装 node。


### 2. 安装 nico

参考 http://lab.lepture.com/nico/zh/

另外，如果你安装了 socket.io 的话，将有 livereload 功能。

```
$ npm install socket.io -g
```

### 3. 安装 CMD theme

Linux & Mac 用户一键安装：

```
curl https://raw.github.com/spmjs/nico-cmd/master/bootstrap.sh | sh
```

Windows 用户安装：

1.切换到`.spm`目录

2.创建一个`themes`的目录并切换进入

3.从 git 上拉一份 cmd 的 theme

4.重命名`nico-cmd`目录为`cmd`

P.S. __注意千万别把`C:\Users\{{username}}\.spm\themes\cmd`目录设置为全局PATH，这样`nico`命令会失效，切记！__

```
cd C:\Users\{{username}}\.spm

mkdir themes
cd themes

git clone https://github.com/spmjs/nico-cmd.git

rename nico-cmd cmd

cd cmd
```

## 使用说明

使用 [spm-doc](https://github.com/spmjs/spm-doc) 来管理模块文档。

## 文档编辑

- http://lab.lepture.com/nico/zh/
- http://lab.lepture.com/nico/zh/syntax

nico 还会用到模块根目录下的 package.json 文件，具体项的含义请参考：[spm package.json](https://github.com/spmjs/spm/wiki/package.json)

其中 ``repository.url`` 用来生成 View the Project 链接， ``bugs.url`` 用来生成讨论链接。


### 特有功能

用三个 ` 会高亮显示代码

    ```js
    function something() {
    }
    ```

用四个 ` 会高亮显示代码，还会将代码插入到生成的 HTML 页面中

    ````js
    function something() {
    }
    ````

    ````html
    <div class="content"></div>
    ````

插入 iframe

    ````iframe
    <link rel="stylesheet" href="css/some.css">
    <button>click</button>
    <script>
        seajs.use('jquery', function($) {
            $('button').click(function() { alert('hello'); })
        });
    </script>
    ````

还可以设置 iframe 的高度

    ````iframe:400
    ````

生成 iframe 的模板是 `templates/iframe.html`，不用写头写尾。



## 输出

假设模块的目录结构为（以下结构可以用 [spm init 插件](https://github.com/spmjs/spm-init) 来生成）：

```
package.json
src/
    hello-world.js
examples/
    hello-world.md
docs/
    hello-world.md
README.md
```

执行 `spm doc build` 后会生成：

```
package.json
_site/
    index.html
    src/
        hello-world.js
    examples/
        hello-world.html
    docs/
        hello-world.html
src/
    hello-world.js
examples/
    hello-world.md
docs/
    hello-world.md
README.md
```

所有生成的文件都在 `_site` 目录下。


## 测试

使用 [spm test](http://docs.spmjs.org/cli/test) 命令就可以直接在命令行里运行用例。`依赖 spm doc`

当然也可以使用 spm doc watch 启动服务，然后访问 http://127.0.0.1:8000/tests/runner.html 用例页面进行测试。
