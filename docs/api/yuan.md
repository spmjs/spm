# yuan

- pubdate: 2013-03-26
- index: 5

communication with spmjs.org.

-----

```js
var yuan = require('spm').sdk.yuan
```

This is a lower API, for higher API, use:

- `spm.publish`
- `spm.unpublish`
- `spm.info`
- `spm.search`
- `spm.login`

## login

Login your account.

```
yuan(options).login(user, callback)
```

## register

Register an account.

```
yuan(options).register(user, callback)
```

## info

Get information of a module.

## Search

Search modules.

## publish

Publish a module.

## unpublish

Unpublish a module.

## upload

Upload docs.
