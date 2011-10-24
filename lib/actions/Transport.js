/**
 * @fileoverview spm transport path/to/transport.js
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('./ActionFactory');
var fsExt = require('../utils/fsExt');
var Annotation = require('../utils/Annotation');
var Compressor = require('../utils/Compressor');
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
  var transportFile = this.args[0];

  // spm transport
  if (!transportFile) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    callback({ errCode: -1 });
    return;
  }

  // spm transport not-exists
  transportFile = path.resolve(transportFile);

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

    var dir = path.dirname(transportFile);
    dir = path.join(dir, meta.version);
    fsExt.mkdirS(dir);

    var srcOutputFile = path.join(dir, meta.filename + '-debug.js');

    if (path.existsSync(srcOutputFile) && !options.force) {
      console.log(MESSAGE.ALREADY_EXISTS, path.basename(srcOutputFile));
      callback({ errCode: -3 });
      return;
    }

    var minOutputFile = srcOutputFile.replace(DEBUG, '');
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
      var extra = meta.extra;

      if (extra) {
        Transport.getExtra(
            extra,
            path.dirname(meta.src),
            path.dirname(srcOutputFile),
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


Transport.getMeta = function(filepath, callback) {
  var meta = Annotation.parse(filepath);
  normalizePath(meta, filepath);

  var packageFile = meta['package'];

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
    meta.filename = (meta.filename || meta.name).toLowerCase();
    checkMetaIsValid(meta);
    callback(meta);
  }
};


Transport.getExtra = function(extra, from, to, callback) {
  if (typeof extra === 'string') {
    extra = [extra];
  }
  var len = extra.length;

  extra.forEach(function(extraFile) {
    fsExt.readFromPath(extraFile, function(code) {

      var outputFile = path.join(to, extraFile.replace(from, ''));
      fs.writeFileSync(outputFile, code, 'utf8');

      if (callback && --len === 0) {
        callback();
      }
    });
  });
};


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


function normalizePath(meta, transportFile) {
  ['package', 'src', 'min'].forEach(function(p) {
    if (meta[p] && !/^https?:/.test(meta[p])) {
      meta[p] = path.join(path.dirname(transportFile), meta[p]);
    }
  });
}


function checkMetaIsValid(meta) {
  ['name', 'version'].forEach(function(p) {
    if (!meta.hasOwnProperty(p)) {
      console.dir(meta);
      throw MESSAGE.META_INVALID + p;
    }
  });
}


function noop() {

}


module.exports = Transport;
