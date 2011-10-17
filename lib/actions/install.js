/**
 * @fileoverview spm install.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var CONFIG = require('../config');
var ActionFactory = require('./ActionFactory');


var Install = ActionFactory.create('Install');


Install.MESSAGE = {
  USAGE: 'Usage: spm install name[@version]',

  DESCRIPTION: 'Install a package',

  NOT_FOUND: 'No such package: '
};


var MESSAGE = Install.MESSAGE;


Install.prototype.run = function() {

  var args = this.args[0].split('@');
  var name = args[0];
  var version = args[1];
  var MESSAGE = this.MESSAGE;

  if (!name) {
    console.log(MESSAGE.USAGE);
    return;
  }

  Net.readFromPath(CONFIG.MODULES_REGISTRY, function(data) {
    var registry = JSON.parse(data);
    var meta = registry[name];

    if (!meta) {
      console.log(MESSAGE.NOT_FOUND + name);
      return;
    }

    

  });


};





module.exports = Install;
