// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var EventEmitter = require('events').EventEmitter;
var argumentsParser = require('../helper/arguments_parser');
var util = require('util');
var MESSAGE = require('../config').MESSAGE;


function Action(args) {
  EventEmitter.call(this);
  this.config = argumentsParser(args, this.AVAILABLE_OPTIONS);
}

util.inherits(Action, EventEmitter);


Action.prototype.__defineGetter__('name', function() {
  throw 'Please define name property in your own class.';
});

Action.prototype.AVAILABLE_OPTIONS = {};

Action.prototype.run = function() {
  throw 'Please implement your own "run()".';
};

Action.prototype.help = function(config) {
  var NAME = this.constructor.name_.toUpperCase();
  var result = MESSAGE[NAME + '_HELP'] || '';

  if (config && config.verbose) {
    var verboseHelp = MESSAGE[NAME + '_HELP_OPTIONS'];
    result += verboseHelp ? '\n' + verboseHelp : '';
  }
  return result;
};

Action.prototype.__defineGetter__('completion', function() {
  return '';
});


// factory
module.exports = function(name, constructor) {
  function SubAction(args) {
    Action.call(this, args);
    if (constructor) {
      constructor.call(this);
    }
  }
  util.inherits(SubAction, Action);

  SubAction.name_ = name;
  return SubAction;
};
