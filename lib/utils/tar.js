// Thanks to npm.
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var Stream = require('stream');
var path = require('path');
var fs = require('fs');
var log = require('./log');

var umask = parseInt(022, 8);
var modes = {
  exec: 0777 & (~umask),
  file: 0666 & (~umask),
  umask: umask
};

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

exports.create = function(source, target, callback) {
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

  var ignoreFiles = [];
  if (source === '.') {
    ignoreFiles = ['.gitignore', '.spmignore'];
  }
  var istream = new Packer({
    path: source,
    type: 'Directory',
    ignoreFiles: ignoreFiles,
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

exports.extract = function(source, target, callback) {
  var umask = modes.umask;
  var dmode = modes.exec;
  var fmode = modes.file;

  function returnError(err) {
    // don't call the callback multiple times, just return the first error
    var _callback = callback;
    callback = function() {};
    return _callback(err);
  }

  var freader = source instanceof Stream ? source : fs.createReadStream(source);
  freader.on('error', function(err) {
    log.error('reading', source);
    return returnError(err);
  });

  var extract_opts = {
    type: 'Directory',
    path: target,
    // strip: 0,
    filter: function() {
      // symbolic links are not allowed in packages
      if (this.type.match(/^.*Link$/)) {
        log.warn('excluding',
            this.path.substr(target.length + 1) + ' -> ' + this.linkpath
        );
        return false;
      }
      return true;
    }
  };
  if (!isWindows && typeof myUid === 'number' && typeof myGid === 'number') {
    extract_opts.uid = myUid;
    extract_opts.gid = myGid;
  }

  var extractor = tar.Extract(extract_opts);
  extractor.on('error', function(err) {
    log.error('untar', source);
    return returnError(err);
  });
  extractor.on('entry', function(entry) {
    entry.mode = entry.mode || entry.props.mode;
    entry.mode = entry.mode | (entry.type === 'Directory' ? dmode : fmode);
    entry.mode = entry.mode & (~umask);
    entry.props.mode = entry.mode;

    if (!isWindows && typeof myUid === 'number' && typeof myGid === 'number') {
      entry.props.uid = entry.uid = myUid;
      entry.props.gid = entry.gid = myGid;
    }
  });

  extractor.on('end', function() {
    return callback(null, target);
  });

  var unzipper = zlib.Unzip();
  unzipper.on('error', function(err) {
    log.error('unzip', source);
    return returnError(err);
  });

  freader.pipe(unzipper).pipe(extractor);
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

  Ignore.call(this, props);

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

  // always keep dist
  if (entry === 'dist') {
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
  if (entry.type !== "Directory") {
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


var os = require('os');
function isWindows() {
  return os.platform() === 'win32';
}
