# Plugin

- pubdate: 2013-03-20
- index: 10

----------


Plugins are commands that can be excuted(indexed) by `spm`.

Lets try:

```
$ npm install spm-init -g
```

`spm-init` is a spm plugin, when you excute `spm -h`, you will find that spm has a plugin commands called `init`.

Create a plugin is simple with `spm-init`. Get the template:

```
$ git clone git://github.com/spmjs/template-spmplugin.git ~/.spm/init/spmplugin
```

And now, you can create a plugin:

```
$ spm init spmplugin
```


## The background

Learn the background of spm plugins.

### Install

Thanks for npm's `postinstall` policy.

Add in your `package.json`:

```js
{
    "scripts": {
        "postinstall": "scripts/postinstall.js"
    }
}
```

Create a `scripts/postinstall.js` in your package:

```js
#!/usr/bin/env node

var spm = require('spm')
spm.plugin.install({
    name: 'init',
    binary: 'spm-init',
    description: 'Generate project scaffolding from a template.'
});
```

Make this script excutable by:

    $ chmod +x scripts/postinstall.js


And when you install this package, for example:

    $ npm install spm-init -g

You will see init on spm now:

    $ spm help


### Uninstall

Add in your `package.json`:

```js
{
    "scripts": {
        "uninstall": "scripts/uninstall.js"
    }
}
```

Create a `scripts/uninstall.js` in your package:

```js
#!/usr/bin/env node

var spm = require('spm')
spm.plugin.uninstall('init')
```

Make this script excutable by:

    $ chmod +x scripts/postinstall.js


## Plugins

You can find some offical plugins on [github](https://github.com/spmjs).
