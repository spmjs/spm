var path = require('path');
var async = require('async');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var env = require('../utils/env.js');
var Sources = require('./sources.js');

// State that represents a dependency node that has been omitted for duplicating another dependency node.
const INCLUDE = 0;

// State that represents a dependency node that has been omitted for conflicting with another dependency node.
const OMITTED_FOR_DUPLICATE = 1;

// State that represents a dependency node that has been omitted for conflicting with another dependency node.
const OMITTED_FOR_CONFLICT = 2;

// State that represents a dependency node that has been omitted for introducing a cycle into the dependency tree.
const OMITTED_FOR_CYCLE = 3;

var sources;
var project;
function Dependency(cb) {
  // 已经解析过的模块.
  var that = this;
  this.includes = [];

  sources = project.moduleSources;

  var mod = new Module(project.root, project.name, project.version);
  mod.setDeps(project.dependencies);

  this.rootNode = new DependencyNode(null, project.name, mod);
  this.rootNode.state = INCLUDE;
  this.includes.push(this.rootNode);

  this.buildDependencyGraph(this.rootNode, project.dependencies, function() {
    // console.info(that.rootNode.toString());
    cb(that.rootNode);
  });
}

Dependency.init = function(_project, cb) {
  project = _project;
  new Dependency(cb);
};

Dependency.prototype = {

  buildDependencyGraph: function(parentNode, deps, cb) {
    var that = this;

    async.forEachSeries(Object.keys(deps), function(aliasName, callback) {
      var modId = deps[aliasName];

      // find reserved module;
      if (modId === aliasName) {
        callback();
        return;
      }

      Module.parseModById(modId, function(mod) {
        var node = new DependencyNode(parentNode, mod.name, mod);
        parentNode.addChild(node);

        if (that.isLoaded(node)) {
          // 判断是否冲突状态.
          // 冲突或者已经解析的模块不再解析.
          // 如果新加的模块已经加载过, 而且模块版本相同，则是重复依赖
          // 如果模块的版本不同，则依赖冲突

          var oldNode = that.getNode(node);
          if (mod.version === oldNode.mod.version) {
            node.state = OMITTED_FOR_DUPLICATE;
          } else {
            node.state = OMITTED_FOR_CONFLICT;
          }

          // 模块优先级判断.
          if (node.getDepth() < oldNode.getDepth()) {
            oldNode.state = node.state;
            node.state = INCLUDE;
          }

          callback();
          return;
        } else {
          node.state = INCLUDE;
        }

        that.includes.push(node);
        that.buildDependencyGraph(node, mod.deps || {}, callback);
      });
    }, cb);
  },

  isLoaded: function(node) {
    var includes = this.includes;
    if (includes.length === 0) {
      return false;
    }

    return includes.some(function(oldNode) {
      return oldNode.equals(node);
    });
  },

  getNode: function(node) {
    var include;
    var includes = this.includes;

    for (var i = 0, len = includes.length; i < len; i++) {
      include = includes[i];

      if (include.equals(node)) {
        return include;
      }
    }
  }
};

function Module(root, name, version, subMod) {
  root = root || '';
  subMod = subMod || '';
  if (root === '#') {
    root = '';
  }

  this.root = root;
  this.name = name;
  this.version = version;
  this.subModId = env.normalizePath(path.join(root, name, version, subMod));
}

Module.prototype.setDeps = function(deps) {
  this.deps = deps || {};
  project.normalizeDeps(this.deps);
};

Module.parseModById = function(modId, cb) {
  sources.getSourceModule(modId, function(err, id, filePath) {
    if (err) {
      console.warn('parse [' + aliasName + ':' + modId + '] error!');
      callback();
    }

    var packagePath = path.join(filePath, '..', 'package.json');
    var packageJson;
    if (fsExt.existsSync(packagePath)) {
      packageJson = JSON.parse(fsExt.readFileSync(packagePath));
    } else {
      var modInfo = Sources.moduleIdParse(modId);
      packageJson = {
        root: '',
        name: modInfo.moduleName,
        version: modInfo.version,
        dependencies: {}
      };
    }
    var version = packageJson.version;
    var subMod = modId.slice(modId.indexOf(version) + (version.length + 1));
    var mod = new Module(packageJson.root, packageJson.name, version, subMod);
    mod.setDeps(packageJson.dependencies);
    cb(mod);
  });
};

function DependencyNode(parentNode, alias, mod) {
  this.alias = alias;
  this.mod = mod;
  this.children = [];
  this.parentNode = parentNode || null;
}

DependencyNode.prototype = {
  accept: function(visitor) {
    if (visitor.visit(this)) {
      this.getChildren.every(function(child) {
        return child.accept(visitor);
      });
    }
    return visitor.endVisit(this);
  },

  addChild: function(node) {
    this.children.push(node);
    node.parentNode = this;
  },

  getParent: function() {
    return this.parentNode;
  },

  getChildren: function() {
    return this.children;
  },

  hasChildren: function() {
    return this.children.length > 0;
  },

  getDepth: function() {
    var depth = 0;
    var node = this.getParent();

    while (node != null) {
      depth++;
      node = node.getParent();
    }
    return depth;
  },

  toString: function() {
    var mod = this.mod;
    var str = '[' + this.alias + ':' + mod.subModId + ':' + this.state + ']';

    if (this.hasChildren) {
      str += '\n';
      this.getChildren().forEach(function(child) {
        str += paddingSpace(child.getDepth()) + child.toString();
      });
    }
    return str;
  },

  equals: function(node) {
    var mod1 = this.mod;
    var mod2 = node.mod;
    return mod1.root === mod2.root &&
        mod1.name === mod2.name;
  }
};

function paddingSpace(num) {
  var str = '';
  while(num-- && num > -1) {
    str += '   ';
  }
  return str;
}

module.exports = Dependency;
