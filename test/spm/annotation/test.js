// vim: set ts=2 sw=2:
var assert = require('assert'),
    annotation = require('../../../lib/spm/annotation'),
    fs = require('fs'), path = require('path'),
    util = require('../../../lib/util');

var getFile = function(p) {
  return path.join(__dirname, p);
};

exports.run = function() {
  util.readFromPath(getFile('allcmts.tspt'), function(comments) {
    var o = annotation.parse(comments);

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
  });
};
