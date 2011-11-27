/**
 * @fileoverview SeaJS Package Manager.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var util = require('util');
var Action = require('Action.js');


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
  return SubAction;
};
