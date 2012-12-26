var path = require('path');
var moduleHelp = require('../../utils/module_help.js');
var fsExt = require('../../utils/fs_ext.js');

var isJs = moduleHelp.isJs;
var isCss = moduleHelp.isCss;
var isJson = moduleHelp.isJson;

function DebugModule(project) {
  this.project = project;
  var debug = project.debugName;
  this.debug = debug ? ('-' + debug) : debug;
  this.codeList = [];
}

DebugModule.prototype.addRelaModule = function(modName, deps, callback) {
  if (!this.debug) {
     callback();
     return;
  }

  var that = this;
  var debug = this.debug;
  var project = this.project;
  var modId = project.getModuleId(modName);
  var code = project.getModuleCode(modName);
  var debugModId = modId + this.debug;
  var debugDeps = deps.map(function(dep) {
    if (isCss(dep) || isJson(dep)) {
      return dep;
    }
    // return moduleHelp.getBaseModule(dep, debug);
    return moduleHelp.getBaseModule(dep) + debug;
  });

  // 然后在用这些deps对代码进行替换.
  modName = moduleHelp.normalize(modName); 
  if (isJs(modName)) {
    code = moduleHelp.filterIdAndDeps(code, debugModId, debugDeps);
    code = moduleHelp.filterRequire(project, code, debug);
  }

  if (project.type === 'css') {
    this.codeList.push('/** ' + modId + ' **/');
  }

  this.codeList.push(code);
  callback();
};

DebugModule.prototype.addGlobalModule = function(modName, callback) {
  if (!this.debug) {
     callback();
     return;
  }

  var that = this;
  var project = this.project;
  var debugModId = getDebugName(modName, this.debug);

  project.getGlobalModuleCode(debugModId, function(moduleCode) {
    that.codeList.push(moduleCode);
    if (project.type === 'css') {
      // that.codeList.push('/** ' + modName + ' **/');
    }

    callback();
  });
};

DebugModule.prototype.addCode = function(code, callback) {
  this.codeList.push(code);
  callback();
};

DebugModule.prototype.output = function(filename, callback) {
  if (!this.debug) {
     callback();
     return;
  }

  var project = this.project;
  var codes = this.codeList.join('\n\n');
  var debugFilename = getDebugName(filename, this.debug); 
  fsExt.writeFileSync(debugFilename, codes);
  callback();
};

function getDebugName(filename, debug) {
  var ext = path.extname(filename);
  if (ext) {
    return filename.replace(new RegExp('\\' + ext + '$'), debug + ext);
  } else {
    return filename + debug;
  }
}

module.exports = DebugModule;
