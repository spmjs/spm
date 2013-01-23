# ast

- pubdate: 2013-01-23

The AST of javascript.

-----

```js
var ast = require('spm').sdk.ast
```

## ast.parseDefines

Get information of the defined factory.

```js
define('id', ['a'], function() {
});
```

When `ast.parseDefines(code)` this code block, it will return:

```
[
    {id: 'id', dependencies: ['a'], factory: factoryNode}
]
```

## ast.getRequires

Get all required modules.

```js
define(function(require) {
    var $ = require('jquery');
    var _ = require('underscore');
});
```

When `ast.getRequires(code)` this code block, it will return:

```
['jquery', 'underscore']
```

## ast.replaceRequire

Replace the value in `require`.

```js
define(function(require) {
    var $ = require('jquery');
    var _ = require('underscore');
});
```

We will replace the value in `require`:

```js
ast.replaceRequire(code, function(value) {
    if (value === 'jquery') {
        return 'gallery/jquery/1.7.2/jquery'
    } else if (value === 'underscore') {
        return 'gallery/underscore/1.1.0/underscore'
    }
});
```

Now we get the code:

```js
define(function(require) {
    var $ = require('gallery/jquery/1.7.2/jquery');
    var _ = require('gallery/underscore/1.1.0/underscore');
});
```

## ast.replaceDefine

Replace the value in `define`.

```js
define(function(require) {
    var $ = require('jquery');
    var _ = require('underscore');
});
```

After `ast.replaceDefine(code, 'id', ['a'])` it will be:

```js
define('id', ['a'], function(require) {
    var $ = require('jquery');
    var _ = require('underscore');
});
```

## ast.replaceAll

Replace the value in `define` and `require`:

```js
define('id', ['a'], function(require) {
    var $ = require('jquery');
    var _ = require('underscore');
});
```

Now, replace with:

```js
ast.replaceAll(code, function(value) {
    if (value === 'id') return 'id2';
    if (value === 'a') return 'abcd';
    if (value === 'jquery') return 'gallery/jquery/1.7.2/jquery';
});
```

The code should be:

```js
define('id2', ['abcd'], function(require) {
    var $ = require('gallery/jquery/1.7.2/jquery');
    var _ = require('underscore');
});
```
