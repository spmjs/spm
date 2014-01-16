/* module */

var util = require('util');
var cmd = require('cmd-util');
var log = require('../utils/log');
var file = require('./file');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

function parseDependencies(deps) {
  return Object.keys(deps).map(function(key) {
    return key + '@' + deps[key];
  })
}
exports.parseDependencies = parseDependencies;
