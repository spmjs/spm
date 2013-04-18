# Static Package Manager

---------------------------

spm is a package manager, **it is not build tools**.

If you are looking for a build tool, you should use grunt, and some grunt tasks.

Some useful links of build:

- https://github.com/spmjs/grunt-cmd-transport
- https://github.com/spmjs/grunt-cmd-concat

## Release

We have a regular release schedule:

1. monthly release for big features or API changes
2. weekly(maybe longer) release for small features and bug fix
3. daily(maybe days) release in ninja channel

### Stable Channel

Get the latest stable spm with:

```
$ npm install spm -g
```

### Ninja Channel

Get the latest spm in ninja channel with:

```
$ npm install spm@ninja -g
```

Use ninja release at your own risk. This branch may contain experimental features, and it may break your heart.


## Plugins

- https://github.com/spmjs/spm-deploy
- https://github.com/spmjs/spm-init
- https://github.com/spmjs/spm-status
- https://github.com/spmjs/spm-doc

## Contribute

Yes, please do contribute. But before this, you should read our [Contributing Guide](https://github.com/spmjs/spm2/blob/master/CONTRIBUTING.md).


## Changelog

**To be decided** `2.1.0`

- Remove spm-build, spm focus on package management.
- spm can invoke tasks in gruntfile.
- various bugfix.

**April 9th, 2013** `2.0.3`

- Fix spm-tree, pretty log on conflict dependencies
- Install global with `spm install -g`

**April 3rd, 2013** `2.0.2`

- Fix publish docs [#17](https://github.com/spmjs/spm2/issues/17)
- Friendly notification when 401

**April 2st, 2013** `2.0.1`

- Parsing dependencies from alias [#13](https://github.com/spmjs/spm2/issues/13)
- Fix customized installation of non-cmd module
- Fix installation of devAlias and engines

**April 1st, 2013** `2.0.0`

First version of spm with:

- tree
- info
- search
- install
- login
- publish
- unpublish
