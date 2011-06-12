.tspt file
==========

The `.tspt` file provides your code transporting's template with 
meta infomation.

Here goes `transport.js` of seajs.

    /**
     * @package http://seajs.com/package.json
     *
     * @src http://seajs.com/build/sea-debug.js
     * @min http://seajs.com/build/sea.js
     *
     * @filename sea
     */

    /*{{code}}*/

wrapping template
-----------------

Here goes an example for wrapping jquery

    define(function(require, exports, module) {

      /*{{code}}*/

      module.exports = $.noConflict(true);
    });

As you can see above, `/*{{code}}*/` is a placeholder for your actual code.

Then you need some exports api so that jquery will work with seajs,
so we use `module.exports = $.noConflict(true);` for exporting jquery.

Sometimes you need some code for preparation, then put them before your 
code; sometimes you need some cleanup, then put them after your code.

meta infomation
---------------

Meta infomation help spm build a whole code repos for more organizing. and 
its compatible with commonjs's package spec.

We use jsdoc-like annotation for meta config, so here goes the smallest config.

    /**
     * @package /path/to/your/package.json
     * @src /path/to/your/sourceCode.js
     */

`@package` you can just give your package.json for `npm` or other package 
manager, and provide an stable version of source code, after `@src`.

Then `spm` will take care the rest.

1. query your `package.json`, get your meta infomation.
2. make sure your code is a stable version.
3. query your source code, wrap it with your template.
4. minify your code with UglifyJS, wrap it with your template, again.
5. update our code repos's config, so that the webpage will update immediately.

If you do not have a `package.json` you can still write all your config in 
annotation format.

Like jQuery:

    /**
     * @name jquery
     * @description jQuery is a new kind of JavaScript Library.
     * @author John Resig
     * @homepage http://jquery.com/
     * @keywords dom,event
     * @version 1.6.1
     *
     * @src http://code.jquery.com/jquery-1.6.1.js
     * @min http://code.jquery.com/jquery-1.6.1.min.js
     */

