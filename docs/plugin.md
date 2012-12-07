# Plugin

----------

Writing a plugin for spm is easy. Just ``spm plugin create``.


## Action plugin

An action plugin will add a subcommand to spm. Let's write a plugin:

1. in your terminal:

    ```
    $ spm plugin create

      plugin name: hello
      plugin description: just a hello world
      create bin file? y
    ```

2. You are almost done. Now install this ``spm-hello``:

    ```
    $ cd spm-hello
    $ npm install -g
    $ spm help

      ♨  Static Package Manager

      Usage: spm <command> [options]

      Options:

        -h, --help     output usage information
        -V, --version  output the version number

      Commands:

        build          build a cmd module
        config         configuration for spm
        plugin         the plugin system for spm

      Extensions:

        hello          just a hello world
    ```


3. Let's make it real one. Edit ``bin/spm-hello``:

    ```
    var commander = require('commander')
    commander.usage('[word]')
    commander.parse(process.argv)
    console.log(commander.args.join(' '))
    ```

4. install this plugin again, and have a try:

    ```
    $ npm install -g
    $ spm hello sing a song
    sing a song
    ```


## Lifecycle plugin

A lifecycle plugin will run the specified command at the specified time, it
should be synchronous.

## Event plugin


```js
exports.registerListener = function() {
    spm.on('upload', function() {
        console.log('upload')
    })

    spm.on('compile', function() {
        console.log('compile')
    })
}
```

## Logging

Logging is import for spm, use the logging provided by spm:

```js
var logging = require('spm').logging
```

There are 6 API for you:

1. start: this means the start of your program (or function).
2. end: this means the end of your program (or function), if you ``start``, you must ``end.
3. debug: use it for debug information, for example http request.
4. info: the normal information.
5. warn: if there is something you want to warn people.
6. error: logging the error message.
