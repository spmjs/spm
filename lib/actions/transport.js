/**
 * @fileoverview spm transport path/to/transport.js
 * @author lifesinger@gmail.com (Frank Wang)
 */

var path = require('path');
var async = require('async');
require('shelljs/global');

var ActionFactory = require('../core/action_factory.js');
var ProjectFactory = require('../core/project_factory.js');
var fsExt = require('../utils/fs_ext.js');
var Annotation = require('../utils/annotation.js');
var Compressor = require('../utils/compressor.js');
var Modules = require('./sources').Modules;
var PluginConfig = require('../core/plugin_config.js');

var Transport = ActionFactory.create('Transport');

const DEBUG = '-debug';

Transport.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('transport a module.');
  opts.usage('spm transport [--force] transport.js');
  opts.add('f', 'force', 'override existing files');
  opts.add('dev', 'get development version');
};

Transport.CONFIG = {
  ID_PLACE_HOLDER: '{{id}}',
  DEBUG_REG: /\{\{debug\}\}/g,
  CODE_PLACE_HOLDER: '/*{{code}}*/'
};


var MESSAGE = {
  START: 'Start transporting',

  NOT_FOUND: '\nNo such file: %s\n',

  META_INVALID: 'The meta object must have this property: ',

  VER_INVALID: '\n   ** The meta.version is unstable: %s\n' +
      '      Turn on --dev option if you want to get it.\n',

  ALREADY_EXISTS: '\n   ** This module already exists: %s\n' +
      '      Turn on --force option if you want to override it.\n',

  SUCCESS: 'Transported to %s\n'
};

var CONFIG = Transport.CONFIG;

var argv = {};

Transport.prototype.execute = function(options, callback) {
  argv = options || this.argv;

  args = options.modules || options._.slice(3);

  if (typeof args === 'string') {
    args = [args];
  }

  callback || (callback = noop);

  // spm transport
  if (args.length === 0) {
    console.info(this.help());
    callback({ errCode: -1 });
    return;
  }

  async.forEach(args,
    function(transportFile, cb) {
      transportFile = path.resolve(transportFile);

      // `spm transport folder` equals to `spm transport folder/transport.js`
      if (fsExt.isDirectory(transportFile)) {
        transportFile = path.join(transportFile, 'transport.js');
      }

      // spm transport not-exists
      if (!fsExt.existsSync(transportFile)) {
        console.info(MESSAGE.NOT_FOUND, transportFile);
        cb({ errCode: -2 });
        return;
      }

      // spm transport path/to/transport.js
      Transport.transport(transportFile, cb, options);
    }, function() {
      callback();
    }
  );
};

Transport.transport = function(transportFile, callback, options) {
  console.info(MESSAGE.START);

  Transport.getMeta(transportFile, function(err, meta) {
    if (err) {
      callback(err);
      return;
    }

    var to = path.dirname(transportFile);
    to = path.join(to, meta.version);
    fsExt.mkdirS(to);

    var srcOutputFile = path.join(to, meta.filename + DEBUG + '.js');
    var minOutputFile = srcOutputFile.replace(DEBUG, '');

    if (fsExt.existsSync(minOutputFile) && !options.force) {
      console.info(MESSAGE.ALREADY_EXISTS, to);
      callback({ meta: meta, errCode: -3 });
      return;
    }

    var tmpl = getTemplate(transportFile);
    var id = getId(meta);
    var srcTemplate = parseTemplate(tmpl, id + DEBUG, meta);

    if (meta.src) {
      transport(meta.src, srcOutputFile, srcTemplate, getMin);
    }
    else if (meta.min) {
      getMin();
    }


    function getMin() {
      if (meta.min) {
        var minTemplate = parseTemplate(tmpl, id, meta);
        transport(meta.min, minOutputFile, minTemplate, done);
      }
      else {
        var minCode = Compressor.compress(srcOutputFile);
        minCode = minCode.replace(id + DEBUG, id);
        fsExt.writeFileSync(minOutputFile, minCode);
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
      console.info(MESSAGE.SUCCESS, path.dirname(srcOutputFile));

      var succInfo = {
        'meta': meta,
        'tmpl': tmpl,
        'srcOutputFile': srcOutputFile,
        'minOutputFile': minOutputFile
      };

      var packageInfo = {
        root: meta.root,
        name: meta.filename,
        version: meta.version
      };

      var baseDir = path.dirname(srcOutputFile);
      echo(JSON.stringify(packageInfo)).to(path.join(baseDir, 'package.json'));

      var _success = function() {
        callback(succInfo);
        callback = noop;
      };

      if (argv.upload || argv.deploy) {
        var _options = Transport.prototype.createOptions({base: baseDir});
        ProjectFactory.getProjectModel(_options, function(model) {
          if (argv.upload) {
            upload(model, _success);
          }

          if (argv.deploy) {
            deploy(model, _success);
          }
        });
      } else {
        _success();
      }
    }
  }, options);
};


Transport.getMeta = function(transportFile, callback, options) {
  var meta = Annotation.parse(transportFile);
  var packageFile = normalizePath(meta['package'], transportFile);
  var err;

  if (packageFile) {
    fsExt.readFile(packageFile, function(json) {
      json = JSON.parse(json);

      for (var p in json) {
        // priority: transport.js > package.json
        if (json.hasOwnProperty(p) && !meta.hasOwnProperty(p)) {
          meta[p] = json[p];
        }
      }

      if (argv.version) {
        meta['version'] = argv.version;
      }

      next();
    });
  }
  else {
    next();
  }

  function next() {
    meta['root'] = meta['root'] || 'gallery';

    // If the meta.version is invalid such as 1.1.4-pre, the
    // use helper.js to get the latest stable version.
    if (!/^\d+\.\d+\.\d+$/.test(meta.version)) {
      var helper = path.join(path.dirname(transportFile), 'helper.js');

      if (fsExt.existsSync(helper)) {
        require(helper).getLatestVersion(function(version) {
          meta.version = version;
          done();
        });
      }
      else {
        if (!options.dev) {
          console.info(MESSAGE.VER_INVALID, meta.version);
          err = { errCode: -4, message: 'unstable version' };
        }
        done();
      }
    }
    else {
      done();
    }
  }

  function done() {
    meta.transportFile = transportFile;
    normalizeMeta(meta);
    callback(err, meta);
  }
};


Transport.getExtra = function(extra, root, to, callback) {
  var len = extra.length;

  extra.forEach(function(extraFile) {
    fsExt.readFile(extraFile, function(code) {

      var outputFile = path.join(to, extraFile.replace(root, ''));
      fsExt.mkdirS(path.dirname(outputFile));
      fsExt.writeFileSync(outputFile, code);

      if (callback && --len === 0) {
        callback();
      }
    });
  });
};

function normalizeMeta(meta) {
  checkMetaIsValid(meta);
  meta.filename = (meta.filename || meta.name).toLowerCase();

  var root = meta.root;
  var base = normalizePath(path.dirname(meta.transportFile));

  if (isRelative(meta.src)) meta.src = root + meta.src;
  if (isRelative(meta.min)) meta.min = root + meta.min;

  if (typeof meta.extra === 'string') {
    meta.extra = meta.extra.split(/\s*,\s*/);
  }

  if (root.indexOf(':') > 0 && Array.isArray(meta.extra)) {
    meta.extra = meta.extra.map(function(p) {
      return isRelative(p) ? root + p : p;
    });
  }

  parseAnnotationVariables(meta);
}

function getTemplate(filepath) {
  var template = fsExt.readFileSync(filepath);
  template = template.replace(/\/\*([\s\S]*?)\*\/\s*/, '');
  return template;
}

function parseTemplate(tmpl, id, meta) {
  var id_place_holder = CONFIG.ID_PLACE_HOLDER;
  var debug_reg= CONFIG.DEBUG_REG;

  if (meta.root && tmpl.indexOf('#' + id_place_holder) > -1) {
    id_place_holder = '#' + id_place_holder;
  }

  if (new RegExp(DEBUG + '$').test(id)) {
    tmpl = tmpl.replace(debug_reg, DEBUG);
  } else {
    tmpl = tmpl.replace(debug_reg, '');
  }

  return tmpl.replace(id_place_holder, id);
}

function getId(meta) {
  return path.join(
      meta.root,
      meta.name,
      meta.version,
      meta.filename || meta.name
  );
}

function transport(inputFile, outputFile, template, callback) {
  fsExt.readFile(inputFile, function(code) {

    // remove Unicode BOM Header
    code = code.replace('\ufeff', '');

    code = template.split(CONFIG.CODE_PLACE_HOLDER).join(code);
    fsExt.writeFileSync(outputFile, code);

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

  function error(p) {
    console.dir(meta);
    throw new Error(MESSAGE.META_INVALID + p);
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

function upload(model, cb) {
//console.info('-------------->', model)
  var modPath = path.dirname(model.baseDirectory);
  var root = model.root;
  var modName = model.name;
  var ver = model.version;
  var source = model.getSource();
  var uploadPlugin = PluginConfig.getPlugin('upload');

  tar(root, modPath, modName, ver, function() {
    var tarPath = path.join(modPath, ver, modName + '.tgz');

    if (root && root !== '#') {
      source = source + '/' + root;
    }
    uploadPlugin.uploadTarToServer(tarPath, source, function() {
      console.info('upload ' + model.name + '/' + model.version + ' success!');
      cb();
    });
  });
}

function tar(root, modPath, modName, ver, callback) {
  var modules = new Modules('', path.join(modPath, '..'), noop);

  modules.parseModule(root, modPath, modName, ver, function() {
    rm('-rf', modules.tempDir);
    callback();
  });
}

function deploy(model, cb) {
  var deployPlugin = PluginConfig.getPlugin('deploy');
  model.distDirectory = model.baseDirectory;

  deployPlugin.deployToServer(model, function() {
    console.info('Deploy ' + model.name + '/' + model.version + ' success!');
    cb();
  });
}

module.exports = Transport;
