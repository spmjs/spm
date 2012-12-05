# Design Pattern

-----------------

Rethink the design of spm.

## The core

Every function in the core should be a MUST-HAVE feature. Obviously, coffee is not in the core.

Think about compress, for example uglifyjs. It is not in the core either.
It's not a MUST-HAVE feature.

When we install spm, we install the core.


## The plugins

It should be easy to extend spm without changing any code of spm.

Take an example of spm-uglifyjs.

A spm plugin should define ``scripts`` in its package.json:

```js
{
    "scripts": {
        "postinstall": "scripts/post-install.js",
        "uninstall": "scripts/uninstall.js"
    }
}
```

in ``scripts/post-install.js``:

```js
var spm = require('spm');
spm.installPlugin('spm-uglifyjs')
// this will register spm-uglifyjs to ~/.spm/plugins
```

When ``npm install spm-uglifyjs -g``, it will run ``scripts/post-install.js`` after the installation.

in ``scripts/uninstall.js``:

```js
var spm = require('spm');
spm.uninstallPlugin('spm-uglifyjs')
// this will remove spm-uglifyjs from ~/.spm/plugins
```

When ``npm uninstall spm-uglifyjs -g``, it will run ``scripts/uninstall.js`` after the uninstallation.


## The lifecycle

1. The very first step is collecting plugins:
    - read ``~/.spm/plugins``
    - plugins = [require(..), require(..), ...]

2. register plugins' commands:

    ```js
    plugins.forEach(function(plugin) {
        plugin.register_command && plugin.register_command();
    });
    ```

3. parse command line and distribute command. For example ``spm help``:

    ```
    spm (2.0.0)

    spm is a static package manager.

    Options:
        --version               show spm version
        -h --help               show this menu

    Commands:
        help                    show help info, try spm help build
        build                   from source to distributed package
        upload                  upload distributed package to spmjs.org

    Extensions:
        init                    initialize CMD structure
    ```

    If you installed spm-init, you will see the ``Extensions`` group in command line.

4. every built-in commands should have pre- and post-, take ``build`` for example:

    ```js
    plugins.forEach(function(plugin) {
        plugin.prebuild && plugin.prebuild(arguments);
    });

    spm.build(arguments)

    plugins.forEach(function(plugin) {
        plugin.postbuild && plugin.postbuild(arguments);
    });
    ```

    For example, coffee will need ``prebuild``, and uglify will need ``postbuild``.
