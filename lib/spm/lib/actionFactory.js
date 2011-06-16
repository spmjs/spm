// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var events = require('events'),
    util = require('util');

var ActionFactory = exports;

ActionFactory.create = function(init) {
  var action = function(config) {
    events.EventEmitter.call(this);
    this.config = config || {};
    init && init.call(this);
  };
  util.inherits(action, events.EventEmitter);
  return action;
};
