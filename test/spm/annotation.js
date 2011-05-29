var assert = require('assert'),
    annotation = require('../../lib/annotation'),
    fs = require('fs'), path = require('path');

var comments = fs.readFileSync(path.join(__dirname, 'spec.json'), 'utf8');
var o = annotation.parse(comments);

console.log(o);
assert.equal(o.name, 'KISSY');
assert.equal(o.author[0], 'lifesinger');
assert.equal(o.author[1], 'yiminghe');
assert.equal(o.author[2], 'TaobaoUED f2es');
assert.equal(o.desc, 'An Enjoyable UI Library. 小巧灵活、简洁实用、愉悦编码、快乐开发');
assert.equal(o.url, 'http://kissyui.com/');
assert.equal(o.tags[0], 'dom,event,library,ui library');
assert.equal(o.tags[1], 'all in one');
assert.equal(o.src, 'http://a.tbcdn.cn/s/kissy/1.2.0/kissy.js');
assert.equal(o.min, 'http://a.tbcdn.cn/s/kissy/1.2.0/kissy-min.js');
