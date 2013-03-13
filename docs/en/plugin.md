# Plugin

- pubdate: 2013-02-25

----------


## Register

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


## Uninstall

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
