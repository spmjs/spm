# Static Package Manager

---------------------------

This is a total rewrite of spm, it is still on heavy development.
You should use the old [spm](https://github.com/spmjs/spm) right now.

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


## Repositories

This is the main spm repository. It is the interface of spm.

However, some functional parts are in other repositories:

- [grunt-spm-build][] is the real source of `spm build`.
- [cmd-util][] is the core parser.

If you have any problem about `build`, you should open an issue at [grunt-spm-build][].

[grunt-spm-build]: https://github.com/spmjs/grunt-spm-build
[cmd-util]: https://github.com/spmjs/cmd-util


## Contribute

Yes, please do contribute. But before this, you should read our [Contributing Guide](https://github.com/spmjs/spm2/blob/master/CONTRIBUTING.md).
