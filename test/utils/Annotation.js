/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var fs = require('fs');
var path  =require('path');
var assert = require('assert');

var Annotation = require('../../lib/utils/annotation.js');


var DATA_DIR = path.resolve(__dirname, '../data/transports');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test Annotation.parse');

var result = Annotation.parse(getFile('kissy_transport.js'));
assert.equal(result['name'], 'KISSY');
assert.equal(result['author'].length, 3);
assert.equal(result['author'][0], 'lifesinger');
assert.equal(result['author'][1], 'yiminghe');
assert.equal(result['author'][2], 'Taobao F2Ers');
assert.equal(result['desc'], 'An Enjoyable UI Library. 小巧灵活、简洁实用、愉悦编码、快乐开发');
assert.equal(result['url'], 'http://kissyui.com/');
assert.equal(result['tags'].length, 2);
assert.equal(result['tags'][0], 'dom,event,library,ui library');
assert.equal(result['tags'][1], 'all in one');
assert.equal(result['version'], '1.2.0');
assert.equal(result['src'], 'http://a.tbcdn.cn/s/kissy/1.2.0/kissy.js');
assert.equal(result['min'], 'http://a.tbcdn.cn/s/kissy/1.2.0/kissy-min.js');
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
