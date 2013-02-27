# package.json

- pubdate: 2013-02-23
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
        "alias": {
            "class": "arale/class/1.0.0/class",
            "events": "arale/events/1.0.0/events"
        },
        "output": {
            "base.js": ["base.js", "aspect.js", "attribute.js"]
        },
        "engines": {
            "seajs": "seajs/seajs/1.2.0/sea.js"
        }
    }
}
```

## spm.alias

## spm.output
