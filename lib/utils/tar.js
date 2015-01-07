// Thanks to npm.
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var path = require('path');
var fs = require('fs');
var log = require('spm-log');

var myUid = process.getuid && process.getuid();
var myGid = process.getgid && process.getgid();

if (process.env.SUDO_UID && myUid === 0) {
  if (!isNaN(process.env.SUDO_UID)) {
    myUid = +process.env.SUDO_UID;
  }
  if (!isNaN(process.env.SUDO_GID)) {
    myGid = +process.env.SUDO_GID;
  }
}

exports.create = function(source, target, callback, noIgnore) {
  function returnError(err) {
    // don't call the callback multiple times, just return the first error
    var _callback = callback;
    callback = function() {};
    return _callback(err);
  }

  var fwriter = fstream.Writer({ type: 'File', path: target });
  fwriter.on('error', function(err) {
    log.error('writing', target);
    return returnError(err);
  });

  fwriter.on('close', function() {
    callback(null, target);
  });

  var pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json')));
  var ignoreArray;
  if (pkg && pkg.spm && pkg.spm.ignore) {
    ignoreArray = pkg.spm.ignore;
  } else {
    ignoreArray = [];
  }
  var ignoreFiles = ['.gitignore', '.spmignore'];

  if (noIgnore) {
    ignoreFiles = [];
    ignoreArray = []; // always ignore dist when noIgnore
  }

  var istream = new Packer({
    path: source,
    type: 'Directory',
    ignoreFiles: ignoreFiles,
    ignoreArray: ignoreArray,
    isDirectory: true
  });
  istream.on('error', function(err) {
    log.error('reading', source);
    return returnError(err);
  });

  var packer = tar.Pack({ noProprietary: true });
  packer.on('error', function(err) {
    log.error('creating', target);
    return returnError(err);
  });

  var zipper = zlib.Gzip();
  zipper.on('error', function(err) {
    log.error('gzip', target);
    return returnError(err);
  });

  istream.pipe(packer).pipe(zipper).pipe(fwriter);
};


var Ignore = require('fstream-ignore');
var inherits = require('inherits');

function Packer(props) {
  if (!(this instanceof Packer)) {
    return new Packer(props);
  }

  if (typeof props === 'string') {
    props = { path: props };
  }

  props.ignoreFiles = props.ignoreFiles || [];
  props.ignoreArray = props.ignoreArray || [];

  Ignore.call(this, props);
  Ignore.prototype.addIgnoreRules.call(this, props.ignoreArray, '');

  this.on('entryStat', function(entry, props) {
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

  // package.json should be **allways** included
  if (entry === 'package.json') {
    return true;
  }

  return Ignore.prototype.applyIgnores.call(this, entry, partial, entryObj);
};

Packer.prototype.emitEntry = function(entry) {
  if (this._paused) {
    this.once('resume', this.emitEntry.bind(this, entry));
    return;
  }

  // skip over symbolic links
  if (entry.type === 'SymbolicLink') {
    entry.abort();
    return;
  }

  // files in the root directory of the tarball
  if (entry.type !== 'Directory') {
    var h = path.dirname((entry.root || entry).path);
    var t = entry.path.substr(h.length + 1).replace(/^[^\/\\]+/, '');
    var p = h + '/' + t.replace(/^\//, '');
    entry.path = p;
    entry.dirname = path.dirname(p);
    return Ignore.prototype.emitEntry.call(this, entry);
  }

  // don't pack empty directories
  var me = this;
  entry.on('entry', function(e) {
    if (e.parent === entry) {
      e.parent = me;
      me.emit('entry', e);
    }
  });
  entry.on('package', this.emit.bind(this, 'package'));
};

inherits(Packer, Ignore);
