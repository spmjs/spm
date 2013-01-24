# package.json

----------

```json
{
    "root": "arale",
    "name": "base",
    "version": "1.0.0",
    "description": "base is ....",
    "homepage": "http://aralejs.org/base/",
    "repository": {
        "type": "git",
        "url": "https://github.com/aralejs/base.git"
    },
    "keywords": ["infrastructure"],

    "spm": {
        "alias": {
            "class": "arale/class/1.0.0/class",
            "events": "arale/events/1.0.0/events"
        },
        "output": {
            "base.js": "."
        },
        "engines": {
            "seajs": "seajs/1.2.0/sea"
        }
    }
}
```
