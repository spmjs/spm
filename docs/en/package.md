# package.json

- pubdate: 2013-03-13
- index: 5

----------

spm follows the [Common Module Definition](https://github.com/spmjs/specification) packaging standards, compatible with nodejs' package.json.

CMD [packaging draft](https://github.com/spmjs/specification/blob/master/draft/package.md) add an additional namespace, which is `family`. spm add another namespace, which is `spm`.

A full example of `package.json`:

```json
{
    "family": "arale",
    "name": "base",
    "version": "1.0.0",
    "description": "base is ....",
    "homepage": "http://aralejs.org/base/",
    "repository": {
        "type": "git",
        "url": "https://github.com/aralejs/base.git"
    },
    "keywords": ["class"],

    "spm": {
        "source": "src",
        "output": ["base.js", "i18n/*"],
        "alias": {
            "class": "arale/class/1.0.0/class",
            "events": "arale/events/1.0.0/events"
        },
        "devAlias": {
            "mocha" "gallery/mocha/1.0.0/mocha",
            "expect" "gallery/expect/1.0.0/expect"
        },
        "engines": {
            "seajs": "seajs/seajs/1.2.0/sea.js"
        },
        "platforms": {
            "ie": [6, 7],
            "firefox": ["13"],
            "chrome": [20]
        },
        "platforms": ["ie/6", "chrome/20", "firefox"]
    }
}
```

## spm.alias


## spm.output

Output is an array that contains the files for distribution, it will auto concat the relative dependencies.

### Single File

For example:

```js
// a.js
define(function(require) {
    require('./b')
});

// b.js
define(function(require) {
    require('./c')
});

// c.js
define(function(require) {
});
```

Now define your output as:

```json
{
    "output": ["a.js", "c.js"]
}
```

It will create a `a.js` and a `c.js` in the `dist` directory. The `dist/a.js` contains code of `src/a.js`, `src/b.js` and `src/c.js`. The `dist/c.js` will only contain the code of `src/c.js`, because it requires nothing.


### Glob Pattern

Output also support glob patterns. Take an example:

```
package.json
src/
    i18n/
        en.js
        zh.js
        fr.js
```

Now define your output as:

```json
{
    "output": ["i18n/*.js"]
}
```

And it will distribute every js files to `dist` folder.

If your folder structure is something like this:

```
src/
    i18n/
        locale.js
        en/
            locale.js
        zh/
            zh_CN/
                locale.js
            zh_TW/
                locale.js
```

You should define your output as:

```json
{
    "output": ["i18n/**/*"]
}
```

## merge from old package.json

1. `root` is deprecated, use `family` instead.
2. `dependencies` is deprecated, use `spm.alias` instead.
3. `output` changed
