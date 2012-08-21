/**
 * @fileoverview SeaJS Package Manager.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var util = require('util');
var Action = require('./action.js');
var Opts = require('../utils/opts.js');

var ActionFactory = exports;

ActionFactory.create = function(name, constructor) {
  function SubAction() {
    Action.apply(this, arguments);
    if (constructor) {
      constructor.call(this);
    }
  }

  util.inherits(SubAction, Action);

  SubAction.name_ = name;
  SubAction.opts = Opts.get(name, ('spm ' + name.toLowerCase()).cyan + '\n');
  return SubAction;
};
