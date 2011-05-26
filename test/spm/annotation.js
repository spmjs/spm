var assert = require('assert'),
    annotation = require('../../lib/annotation'),
    fs = require('fs');

var comments = fs.readFileSync(__dirname + '/transport.js', 'utf8');
var o = annotation.parse(comments);
assert.equal(o.name[0], 'KISSY');
assert.equal(o.author[0], 'lifesinger');
assert.equal(o.author[1], 'yiminghe');
assert.equal(o.author[2], 'TaobaoUED f2es');
assert.equal(o.desc[0], 'An Enjoyable UI Library');
assert.equal(o.url[0], 'http://kissyui.com/');
assert.equal(o.tags[0], 'base framework,dom utility');
assert.equal(o.tags[1], 'all in one');
assert.equal(o.src[0], 'http://a.tbcdn.cn/s/kissy/1.2.0/seed.js');
assert.equal(o.min[0], 'http://a.tbcdn.cn/s/kissy/1.2.0/seed-min.js');
