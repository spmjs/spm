// 增加文件过滤功能.
var Ignore = require('fstream-ignore');
var inherits = require('inherits');
var path = require('path');
var fs = require('fs');

module.exports = Packer;

inherits(Packer, Ignore);

function Packer (props) {
  if (!(this instanceof Packer)) {
    return new Packer(props);
  }

  if (typeof props === 'string') {
    props = { path: props };
  }

  props.ignoreFiles = ['.gitignore'];

  Ignore.call(this, props);

  this.on('entryStat', function (entry, props) {
    // files should *always* get into tarballs
    // in a user-writable state, even if they're
    // being installed from some wackey vm-mounted
    // read-only filesystem.
    entry.mode = props.mode = props.mode | 0200;
  });
}

Packer.prototype.applyIgnores = function(entry, partial, entryObj) {

  // some files are *never* allowed under any circumstances
  if (entry === '.git' ||
      entry === '.lock-wscript' ||
      entry.match(/^\.wafpickle-[0-9]+$/) ||
      entry === 'CVS' ||
      entry === '.svn' ||
      entry === '.hg' ||
      entry.match(/^\..*\.swp$/) ||
      entry === '.DS_Store' ||
      entry.match(/^\._/)
    ) {
    return false;
  }

  return Ignore.prototype.applyIgnores.call(this, entry, partial, entryObj);
};
