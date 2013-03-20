# spm

- pubdate: 2013-03-20
- index: 0

The API of spm.

-------

Get the interface of spm:

```js
var spm = require('spm')
```

## spm.version

The version of spm.

## spm.log(category, message)

Always use `spm.log` in your program, never use `console`.

## spm.plugin

- spm.plugin.install
- spm.plugin.uninstall
- spm.plugin.show
- spm.plugin.plugins

## spm.config

Interact with `~/.spm/spmrc` config file.

- spm.config.config
- spm.config.remove
- spm.config.show


## spm.install(options)

Install packages from spmjs.org.

## spm.info(options)

Get information of a module from spmjs.org.

## spm.search(options)

Search modules from spmjs.org.

## spm.publish(options)

Publish a package to spmjs.org.

## spm.unpublish(options)

Unpublish a package from spmjs.org.


## spm.sdk

Low level API:

- [`spm.sdk.ast`](https://github.com/spmjs/cmd-util/blob/master/docs/ast.md)
- [`spm.sdk.iduri`](https://github.com/spmjs/cmd-util/blob/master/docs/iduri.md)
- [`spm.sdk.spmrc`](https://github.com/spmjs/spmrc)
- [`spm.sdk.yuan`](./yuan.md)
- [`spm.sdk.grunt`](./grunt.md)
