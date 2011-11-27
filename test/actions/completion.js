/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var path = require('path');
var assert = require('assert');

var CONFIG = require('../../lib/config.js');
var Completion = require('../../lib/actions/completion.js');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);

var comp, expected;


// {{{
console.log('  test spm [TAB]');
expected = CONFIG.AVAILABLE_ACTIONS.join(' ').replace(' completion', '');

comp = new Completion('spm');
assert.equal(comp.run(), expected);

comp = new Completion('spm b');
assert.equal(comp.run(), expected);
// }}}


// {{{
console.log('  test spm action [TAB]');
expected = getOptions(require('../../lib/actions/Build'));

comp = new Completion('build -');
assert.equal(comp.run(), expected);

comp = new Completion('build --c');
assert.equal(comp.run(), expected);
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getOptions(SubAction) {
  var out = '';
  var options = SubAction.AVAILABLE_OPTIONS || {};

  for (var p in options) {
    if (options.hasOwnProperty(p)) {
      out += options[p].alias.join(' ');
      out += ' ';
    }
  }
  return out.trim();
}
