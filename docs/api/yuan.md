# yuan

- pubdate: 2013-01-23

communication with yuan.

-----

```js
var yuan = require('spm').sdk.yuan
```

This is a lower API, for higher API, use `spm.publish` or `spm.install`.

## Login

```js
yuan({username: 'spm', password: 'spm'})
    .login(function(err, response, body) {
        console.log(body.data);
    })
```

## Publish

```js
yuan({
    auth: 'auth code ....',
    distfile: './hello.tgz',
    root: 'spmjs',
    name: 'spm',
    version': '1.0.0'
}).publish(function(err, response, body) {
    console.log(body);
});
```
