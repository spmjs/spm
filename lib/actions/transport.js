/**
 * @fileoverview spm transport path/to/transport.js
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('./action_factory.js');
var fsExt = require('../utils/fs_ext.js');
var Annotation = require('../utils/annotation.js');
var Compressor = require('../utils/compressor.js');
const DEBUG = '-debug';


var Transport = ActionFactory.create('Transport');


Transport.AVAILABLE_OPTIONS = {
  force: {
    alias: ['--force', '-f'],
    description: 'Override existing files.'
  }
};


Transport.CONFIG = {
  ID_PLACE_HOLDER: '{{id}}',
  CODE_PLACE_HOLDER: '/*{{code}}*/'
};


Transport.MESSAGE = {
  USAGE: 'Usage: spm transport [--force] transport.js',

  DESCRIPTION: 'Transport a module.',

  START: 'Start transporting',

  NOT_FOUND: '\nNo such file: %s\n',

  META_INVALID: 'The meta object must have this property: ',

  ALREADY_EXISTS: '\nError: \'%s\' already exists.\n' +
      '       If you want to override it, please turn on --force option.\n',

  SUCCESS: 'Transported to %s\n'
};


var CONFIG = Transport.CONFIG;
var MESSAGE = Transport.MESSAGE;


Transport.prototype.run = function(callback) {
  callback || (callback = noop);

  // spm transport
  if (this.args.length === 0) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    callback({ errCode: -1 });
    return;
  }

  var transportFile = path.resolve(this.args[0]);

  // `spm transport folder` equals to `spm transport folder/transport.js`
  if (path.existsSync(transportFile) &&
      fs.statSync(transportFile).isDirectory()) {
    transportFile += '/transport.js';
  }

  // spm transport not-exists
  if (!path.existsSync(transportFile)) {
    console.log(MESSAGE.NOT_FOUND, transportFile);
    callback({ errCode: -2 });
    return;
  }

  // spm transport path/to/transport.js
  this.transport(transportFile, callback);
};


Transport.prototype.transport = function(transportFile, callback) {
  var options = this.options;
  console.log(MESSAGE.START);

  Transport.getMeta(transportFile, function(meta) {

    var to = path.dirname(transportFile);
    to = path.join(to, meta.version);
    fsExt.mkdirS(to);

    var srcOutputFile = path.join(to, meta.filename + '-debug.js');
    var minOutputFile = srcOutputFile.replace(DEBUG, '');

    if (path.existsSync(srcOutputFile) && !options.force) {
      console.log(MESSAGE.ALREADY_EXISTS, path.basename(srcOutputFile));
      callback({ errCode: -3 });
      return;
    }

    var tmpl = getTemplate(transportFile);
    var id = getId(meta);
    var srcTemplate = parseTemplate(tmpl, id + DEBUG);

    if (meta.src) {
      transport(meta.src, srcOutputFile, srcTemplate, getMin);
    }
    else if (meta.min) {
      getMin();
    }


    function getMin() {
      if (meta.min) {
        var minTemplate = parseTemplate(tmpl, id);
        transport(meta.min, minOutputFile, minTemplate, done);
      }
      else {
        var minCode = Compressor.compress(srcOutputFile);
        minCode = minCode.replace(id + DEBUG, id);
        fs.writeFileSync(minOutputFile, minCode, 'utf8');
        done();
      }
    }


    function done() {
      if (meta.extra) {
        Transport.getExtra(
            meta.extra,
            meta.root,
            to,
            success);
      }
      else {
        success();
      }
    }


    function success() {
      console.log(MESSAGE.SUCCESS, path.dirname(srcOutputFile));
      callback({
        'meta': meta,
        'tmpl': tmpl,
        'srcOutputFile': srcOutputFile,
        'minOutputFile': minOutputFile
      });
    }
  });
};


Transport.getMeta = function(transportFile, callback) {
  var meta = Annotation.parse(transportFile);
  var packageFile = normalizePath(meta['package'], transportFile);

  if (packageFile) {
    fsExt.readFromPath(packageFile, function(json) {
      json = JSON.parse(json);

      for (var p in json) {
        // priority: transport.js > package.json
        if (json.hasOwnProperty(p) && !meta.hasOwnProperty(p)) {
          meta[p] = json[p];
        }
      }

      done();
    });
  }
  else {
    done();
  }

  function done() {
    meta.transportFile = transportFile;
    normalizeMeta(meta);

    callback(meta);
  }
};


Transport.getExtra = function(extra, root, to, callback) {
  var len = extra.length;

  extra.forEach(function(extraFile) {
    fsExt.readFromPath(extraFile, function(code) {

      var outputFile = path.join(to, extraFile.replace(root, ''));
      fsExt.mkdirS(path.dirname(outputFile));
      fs.writeFileSync(outputFile, code, 'utf8');

      if (callback && --len === 0) {
        callback();
      }
    });
  });
};


function normalizeMeta(meta) {
  checkMetaIsValid(meta);
  meta.filename = (meta.filename || meta.name).toLowerCase();

  var root = normalizePath(meta.root, meta.transportFile) ||
      path.dirname(meta.transportFile);
  meta.root = root = fsExt.normalizeEndSlash(root);

  if (isRelative(meta.src)) meta.src = root + meta.src;
  if (isRelative(meta.min)) meta.min = root + meta.min;

  if (typeof meta.extra === 'string') {
    meta.extra = meta.extra.split(/\s*,\s*/);
  }

  if (Array.isArray(meta.extra)) {
    meta.extra = meta.extra.map(function(p) {
      return isRelative(p) ? root + p : p;
    });
  }
}


function getTemplate(filepath) {
  var template = fs.readFileSync(filepath, 'utf8');
  template = template.replace(/\/\*([\s\S]*?)\*\/\s*/, '');
  return template;
}


function parseTemplate(tmpl, id) {
  return tmpl.replace(CONFIG.ID_PLACE_HOLDER, id);
}


function getId(meta) {
  return path.join(
      meta.name,
      meta.version,
      meta.filename || meta.name
  );
}


function transport(inputFile, outputFile, template, callback) {
  fsExt.readFromPath(inputFile, function(code) {
    code = template.split(CONFIG.CODE_PLACE_HOLDER).join(code);
    fs.writeFileSync(outputFile, code, 'utf8');
    callback();
  });
}


function normalizePath(p, basePath) {
  if (isRelative(p)) {
    p = path.join(path.dirname(basePath), p);
  }
  return p;
}


function checkMetaIsValid(meta) {

  ['name', 'version'].forEach(function(p) {
    if (!meta.hasOwnProperty(p)) {
      error(p);
    }
  });

  if (!meta.src && !meta.min) {
    error('src or min');
  }

  function error(p) {
    console.dir(meta);
    throw MESSAGE.META_INVALID + p;
  }
}


function isRelative(p) {
  return p && p.indexOf(':') === -1 && /^[^\/\\]/.test(p);
}


function noop() {

}


module.exports = Transport;
