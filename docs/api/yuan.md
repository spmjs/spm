# yuan

-----

```js
var yuan = require('spm').sdk.yuan
```

## Overview

```js
yuan({username: 'spm', password: 'spm', distfile: './hello.tgz'})
    .publish('spmjs/spm/1.0.0', function(err, response, body) {
        console.log(body)
    })
```


## Login

```js
yuan({username: 'spm', password: 'spm'})
    .login(function(err, response, body) {
        console.log(body.data.auth);
    })
```

Also available in streaming:

```js
yuan({username: 'spm', password: 'spm'}).login().pipe(process.stdout);

// also available
yuan.login({username: 'spm', password: 'spm'}).pipe(process.stdout);
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


## Info

```js
yuan({root: 'spmjs', name: 'spm'}).info(function(err, response, body) {
    console.log(body);
});
```
