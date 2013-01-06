/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var StringUtil = require('../utils/string.js');
var GLOBAL_CONFIG = require('../config.js');
var PROJECT_CONFIG = require('../../package.json');
var ActionFactory = require('../core/action_factory.js');
var Commander = require('../utils/commander.js');

var Help = ActionFactory.create('Help');

Help.prototype.run = function(callback) {
  var modules = this.opts.args;

  modules = modules.filter(function(mod) {
    return mod.indexOf('-') !== 0;
  });

  var spm = require('../spm');
  var out = '';
  // spm help
  if (modules.length === 0) {
    out += ('spm v' + PROJECT_CONFIG.version + '\n');

    var spmCommand = Commander.get();
    ActionFactory.getDefaultActionList().forEach(function(action) {
      var subCommand = Commander.get(action);
      var actionObj = ActionFactory.getActionObj(action);
      actionObj.registerArgs();
      var message = '    ' + pad(action, 20) + '        ' + (subCommand.description() || '');
      out += '\n' + message;
    });

    out += '\n\n' + 'See \'spm help <command>\' for more information on a specific command.';
  }
  // spm help xxx
  else {
    out += getHelp(modules[0]);
  }

  out += '\n';

  if (callback) {
    callback({ message: out });
  }
  return out;
};

function getHelp(actionName, verbose) {
  return ActionFactory.getActionObj(actionName).help();
}

function pad(str, width) {
  var len = Math.max(0, width - str.length);
  return str + Array(len + 1).join(' ');
}

module.exports = Help;
