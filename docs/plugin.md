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

A lifecycle plugin will run the specified command at the specified time.
