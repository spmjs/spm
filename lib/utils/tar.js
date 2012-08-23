var env = require('./env');
var Packer = require('./fstream-spm');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var Stream = require('stream');
var path = require('path');
var fs = require('fs');

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

  console.log('creating', target);

  function returnError(err) {
    // don't call the callback multiple times, just return the first error
    var _callback = callback;
    callback = function() {};
    return _callback(err);
  }

  var fwriter = fstream.Writer({ type: 'File', path: target });
  fwriter.on('error', function(err) {
    console.error('error writing ' + target);
    return returnError(err);
  });

  fwriter.on('close', function() {
    callback(null, target);
  });

  var istream = Packer({
    path: source,
    type: 'Directory',
    isDirectory: true
  });
  istream.on('error', function(err) {
    console.error('error reading ' + source);
    return returnError(err);
  });

  var packer = tar.Pack({ noProprietary: true });
  packer.on('error', function(err) {
    console.error('tar creation error ' + target);
    return returnError(err);
  });

  var zipper = zlib.Gzip();
  zipper.on('error', function(err) {
    console.error('gzip error ' + target);
    return returnError(err);
  });

  istream.pipe(packer).pipe(zipper).pipe(fwriter);
};

exports.extract = function(source, target, callback) {

  console.log('extracting', source);

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
    console.error('error reading ' + source);
    return returnError(err);
  });

  var extract_opts = {
    type: 'Directory',
    path: target,
    // strip: 0,
    filter: function() {
      // symbolic links are not allowed in packages
      if (this.type.match(/^.*Link$/)) {
        console.warning(
            'excluding symbolic link',
            this.path.substr(target.length + 1) + ' -> ' + this.linkpath
        );
        return false;
      }
      return true;
    }
  };
  if (!env.isWindows && typeof myUid === 'number' && typeof myGid === 'number') {
    extract_opts.uid = myUid;
    extract_opts.gid = myGid;
  }

  var extractor = tar.Extract(extract_opts);
  extractor.on('error', function(err) {
    console.error('untar error ' + source);
    return returnError(err);
  });
  extractor.on('entry', function(entry) {
    entry.mode = entry.mode || entry.props.mode;
    var original_mode = entry.mode;

    // 设置正确的目录访问权限 fix https://github.com/seajs/spm/issues/222
    entry.mode = entry.mode | (entry.type === 'Directory' ? dmode : fmode);
    entry.mode = entry.mode & (~umask);
    entry.props.mode = entry.mode;
    if (original_mode !== entry.mode) {
      console.log(
        'modified mode',
        original_mode + ' => ' + entry.mode + ' ' + entry.path
      );
    }

    if (!env.isWindows && typeof myUid === 'number' && typeof myGid === 'number') {
      entry.props.uid = entry.uid = myUid;
      entry.props.gid = entry.gid = myGid;
    }
  });

  extractor.on('end', function() {
    return callback(null, target);
  });

  var unzipper = zlib.Unzip();
  unzipper.on('error', function(err) {
    console.error('unzip error ' + source);
    return returnError(err);
  });

  freader.pipe(unzipper).pipe(extractor);
};
