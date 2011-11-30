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

  VER_INVALID: 'The meta.version is invalid: ',

  ALREADY_EXISTS: '\n   ** This module already exists: %s\n' +
      '      Turn on --force option if you want to override it.\n',

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
  Transport.transport(transportFile, callback, this.options.force);
};


Transport.transport = function(transportFile, callback, force) {
  console.log(MESSAGE.START);

  Transport.getMeta(transportFile, function(meta) {

    var to = path.dirname(transportFile);
    to = path.join(to, meta.version);
    fsExt.mkdirS(to);

    var srcOutputFile = path.join(to, meta.filename + '-debug.js');
    var minOutputFile = srcOutputFile.replace(DEBUG, '');

    if (path.existsSync(minOutputFile) && !force) {
      console.log(MESSAGE.ALREADY_EXISTS, to);
      callback({ meta: meta, errCode: -3 });
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
    fsExt.readFile(packageFile, function(json) {
      json = JSON.parse(json);

      for (var p in json) {
        // priority: transport.js > package.json
        if (json.hasOwnProperty(p) && !meta.hasOwnProperty(p)) {
          meta[p] = json[p];
        }
      }

      next();
    });
  }
  else {
    next();
  }

  function next() {
    // If the meta.version is invalid such as 1.1.4-pre, the
    // use helper.js to get the latest stable version.
    if (!/^\d+\.\d+\.\d+$/.test(meta.version)) {
      var helper = path.join(path.dirname(transportFile), 'helper.js');

      if (path.existsSync(helper)) {
        require(helper).getLatestVersion(function(version) {
          meta.version = version;
          done();
        });
      }
      else {
        throw MESSAGE.VER_INVALID + meta.version;
      }
    }
    else {
      done();
    }
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
    fsExt.readFile(extraFile, function(code) {

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

  parseAnnotationVariables(meta);
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
  fsExt.readFile(inputFile, function(code) {
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


function parseAnnotationVariables(meta) {
  var version = meta.version;

  if (meta.src) meta.src = replaceVersion(meta.src);
  if (meta.min) meta.min = replaceVersion(meta.min);

  if (Array.isArray(meta.extra)) {
    meta.extra = meta.extra.map(function(p) {
      return replaceVersion(p);
    });
  }

  // replace path/to/{{version}}/x.js to path/to/1.2.3/x.js
  function replaceVersion(p) {
    return p.replace(/\{\{version\}\}/g, version);
  }
}


function isRelative(p) {
  return p && p.indexOf(':') === -1 && /^[^\/\\]/.test(p);
}


function noop() {

}


module.exports = Transport;
