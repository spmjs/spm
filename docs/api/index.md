# spm

- pubdate: 2013-03-26
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

```js
spm.log('install', 'arale/class')
```

## spm.plugin

API for plugins.

### spm.plugin.install(options)

Install a plugin, used by postinstall hook in npm:

```js
spm.plugin.install({
  name: 'init',
  bin: 'spm-init',
  description: 'init …'
})
```

### spm.plugin.uninstall(name)

Uninstall a plugin, used by uninstall hook in npm:

```js
spm.plugin.uninstall('init')
```

### spm.plugin.plugins

All installed plugins:

```
var plugins = spm.plugin.plugins;
```


## spm.config

Interact with `~/.spm/spmrc` config file.

### spm.config.get(key)

Get information in spmrc:

```
spm.config.get('user')
spm.config.get('user.username')
```

### spm.config.set(key, value)

Set section in spmrc:

```
spm.config.set('user.username', 'lepture')
```

### spm.config.remove(section)

Remove a section in spmrc:

```
spm.config.remove('user')
```

## spm.build(options)

Build the module.

### spm.build.loadBuildTasks(options, pkg)

Load build tasks: `spm-build`.

This is a task collection which is [grunt-spm-build](https://github.com/spmjs/grunt-spm-build). You can bind and load this task too.

## spm.login(options)

Login/register spmjs.org.

## spm.install(options)

Install packages from spmjs.org.

## spm.info(options)

Get information of a module from spmjs.org.

## spm.search(options)

Search modules from spmjs.org.

```
spm.search({query: 'jquery'})
```

## spm.publish(options)

Publish a package to spmjs.org.

## spm.unpublish(options)

Unpublish a package from spmjs.org.

```
spm.unpublish({query: 'arale/class@1.0.0'})
```

## spm.sdk

Low level API:

- [`spm.sdk.ast`](https://github.com/spmjs/cmd-util/blob/master/docs/ast.md)
- [`spm.sdk.iduri`](https://github.com/spmjs/cmd-util/blob/master/docs/iduri.md)
- [`spm.sdk.spmrc`](https://github.com/spmjs/spmrc)
- [`spm.sdk.yuan`](./yuan.md)
- [`spm.sdk.grunt`](./grunt.md)
