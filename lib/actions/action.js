/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var argv = require('optimist').argv;
var EventEmitter = require('events').EventEmitter;
var util = require('util');


function Action(modules) {
  EventEmitter.call(this);
  this.modules = modules || (modules = []);
  this.args = argv._.slice(1);
}

util.inherits(Action, EventEmitter);

Action.prototype.run = function() {
  throw 'Please implement your own "run()".';
};


module.exports = Action;
