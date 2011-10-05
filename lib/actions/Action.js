/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var MESSAGE = require('../config').MESSAGE;


function Action(modules, options) {
  EventEmitter.call(this);

  // new Action("a b --ccc")
  // or
  // new Action(["a", "b", "--ccc"])
  if (typeof modules === 'string' ||
      ~(',' + modules).indexOf(',--')) {
    var result = this.parseArgs_(modules);

    this.args = result.args;
    this.modules = result.modules;
    this.options = result.options;
  }

  // new Action(modules, options)
  else {
    this.modules = modules || [];
    this.options = options || {};
  }
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
 *    a b c -d e --fff g -h -k k1 k2
 *
 * with this available options:
 *    {
 *      'ddd': {
 *        alias: ['-d', '--ddd'],
 *        length: 1
 *      },
 *      'fff': {
 *        alias: ['-f', '--fff']
 *      },
 *      'kkk': {
 *        alias: ['-k'],
 *        length: 2
 *      },
 *    }
 * parse into:
 *    {
 *      options: {
 *        'ddd': 'e'
 *        'fff': true,
 *        'kkk': ['k1', 'k2']
 *      },
 *      modules: ['a', 'b', 'c', 'g']
 *    }
 */
Action.prototype.parseArgs_ = function(args, AVAILABLE_OPTIONS) {
  if (typeof args === 'string') {
    args = args.split(/\s+/);
  }

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

    options[name] = true;
    var len = AVAILABLE_OPTIONS[name].length || 0;

    if (len === 0) {
      options[name] = true;
    }
    else if (len === 1) {
      checkValid(args[i + 1]);
      options[key] = args[i + 1];
    }
    else {
      options[key] = [];

      // have more arguments for this option
      while (len--) {
        i++;
        checkValid(args[i]);
        options[key].push(args[i]);
      }
    }
  }

  return {
    args: args,
    options: options,
    modules: modules
  };
};


function checkValid(arg) {
  if (arg === undefined) {
    throw 'Option arguments are not enough.';
  }
}


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
  return this.AVAILABLE_OPTIONS.map(
      function(option) {
        return option.alias.join(' ');
      }).join(' ').trim();
});


module.exports = Action;
