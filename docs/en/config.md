# Config

- pubdate: 2013-02-27
- index: 2

-----

**Status: API design**

Configuration file is located at `~/.spm/spmrc` in ini format:

    $ spm config user.username lepture


## user

The `[user]` section contains information of the current user.

```ini
[user]
username =

; gruntfile can be a local path or an online url
; gruntfile is used for task based commands
gruntfile =
```

## install

The `[install]` section contains settings for installation.

```ini
[install]
; when spm install a module, should we keep the debugfiles
debugfile = true

; spm install path format, it should be end with {{filename}}
format = {{family}}/{{name}}/{{version}}/{{filename}}
```

## source

Define or add your own source center with `[source]` section.

The default source is:

```ini
[source:default]
url = http://spmjs.org
```

You can add another source:

```ini
[source:alipay]
url = http://spmjs.alipay.com
```

When you `info`, `search`, `login`, `install`, `publish`, you can set the source in your command line:

    $ spm info -s alipay jquery
