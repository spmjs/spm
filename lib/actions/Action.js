// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var MESSAGE = require('../spm').MESSAGE;


function Action(args) {
  EventEmitter.call(this);

  var result = this.parseArgs_(args);
  this.options = result.options;
  this.modules = result.modules;
}

util.inherits(Action, EventEmitter);


Action.prototype.__defineGetter__('name', function() {
  throw 'Please define name property in your own class.';
});


Action.prototype.AVAILABLE_OPTIONS = {};


/**
 * parse arguments
 *
 * get these args:
 *
 *    a b c -d e -fff g -h
 *
 * with this available options:
 *    {
 *      'ddd': {
 *        alias: ['-d', '-ddd'],
 *        length: 1
 *      },
 *      'fff': {
 *        alias: ['-f', '-fff']
 *      }
 *    }
 * parse into:
 *    {
 *      options: {
 *        'ddd': [e]
 *        'fff': []
 *      },
 *      modules: ['a', 'b', 'c', 'g']
 *    }
 */
Action.prototype.parseArgs_ = function(args, AVAILABLE_OPTIONS) {
  args = args || [];
  AVAILABLE_OPTIONS = AVAILABLE_OPTIONS || this.AVAILABLE_OPTIONS;

  var options = {};
  var modules = [];

  for (var i = 0, l = args.length; i < l; i++) {
    var arg = args[i];

    // NOT an option. An option starts with `-`
    if (arg.charAt(0) !== '-') {
      modules.push(arg);
      continue;
    }

    var name;

    for (var key in AVAILABLE_OPTIONS) {
      var alias = AVAILABLE_OPTIONS[key].alias || [];

      if (alias.indexOf(arg) !== -1) {
        name = key;
        break;
      }
    }

    if (!name) continue;

    options[name] = [];
    var len = AVAILABLE_OPTIONS[name].length || 0;

    // have more arguments for this option
    while (len--) {
      i++;
      if (args[i] === undefined) {
        throw 'Option arguments are not enough.';
      }
      options[key].push(args[i]);
    }
  }

  return {
    options: options,
    modules: modules
  };
};


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


module.exports = Action;
