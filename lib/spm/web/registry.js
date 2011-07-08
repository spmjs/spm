// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm registry writer.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


var fs = require('fs'),
    path = require('path');


/**
 * spm registry manager.
 */
var Registry = function(registry) {
  if (!registry) {
    return;
  }
  this.registry = registry;
  this.data = {};

  try {
    this.data = JSON.parse(fs.readFileSync(this.registry).toString());
  } catch (e) {
    console.error('Parse error: %s', e.message);
  }

};


/**
 * update module into registry
 */
Registry.prototype.update = function(o, commit) {
  if (!this.registry) return;

  var self = this;

  // is an array
  if (o.forEach) {
    o.forEach(function(obj) {
      self.data[obj.name] = obj;
    });
  }

  // is an single object
  if (o.name) {
    self.data[o.name] = o;
  }

  // commit all change
  commit && self.commit();
};


/**
 * delete module from registry
 */
Registry.prototype.remove = function(name, commit) {
  delete this.data[name];
  commit && this.commit();
};


/**
 * commit all update into registry
 */
Registry.prototype.commit = function() {
  if (!this.registry) return;
  try {
    fs.writeFileSync(this.registry, JSON.stringify(this.data), 'utf-8');
  } catch (e) {
    console.error('Write Registry Error: %s', e.message);
  }
};


/**
 * output all data
 */
Registry.prototype.toString = function() {
  return JSON.stringify(this.data);
};


module.exports = Registry;
