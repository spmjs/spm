// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var EventEmitter = require('events').EventEmitter;
var argumentsParser = require('../helper/arguments_parser');
var util = require('util');


function Action(args) {
  EventEmitter.call(this);
  this.config = argumentsParser(args, this.AVAILABLE_OPTIONS);
}

util.inherits(Action, EventEmitter);


Action.prototype.AVAILABLE_OPTIONS = {};

Action.prototype.run = function() {
  throw 'Please implement your own "run()".';
};

Action.prototype.help = function() {
  return '';
};

Action.prototype.__defineGetter__('completion', function() {
  return '';
});


// factory
module.exports = function(constructor) {
  function SubAction(args) {
    Action.call(this, args);
    if (constructor) {
      constructor.call(this);
    }
  }
  util.inherits(SubAction, Action);

  return SubAction;
};
