var fs = require('fs');
var path = require('path');
var Class = require('arale').Class;
var ast = require('./ast');


var BaseCompressor = Class.create({
  name: 'BaseCompressor',
  encoding: 'utf8',
  ext: 'js',

  validate: function(filepath) {
    filepath = filepath || this.filepath;
    return path.extname(filepath).slice(1) === this.ext;
  },

  initialize: function(filepath, obj) {
    obj = obj || {};
    this.encoding = obj.encoding || 'utf8';

    this.filepath = filepath;
    this.data = fs.readFileSync(filepath, this.encoding);
    this.options = obj;
  },

  run: function() {
  }
});
exports.BaseCompressor = BaseCompressor;


var UglifyCompressor = BaseCompressor.extend({
  name: 'UglifyJS Compressor',
  ext: 'js',

  run: function(callback) {
    if (!this.validate()) {
      callback()
      return;
    }

    var astCache = ast.getAst(this.data);

    var debugfile = this.filepath.replace(/\.js$/, '-debug.js');
    fs.writeFileSync(debugfile, ast.replaceAll(astCache, function(v) {
      if (/\.js$/.test(v)) {
        return v.replace(/\.js$/, '-debug.js');
      }
      return v + '-debug';
    }));

    // TODO: uglify compress options
    fs.writeFileSync(this.filepath, astCache.print_to_string({
    }));

    callback();
  }
});
exports.UglifyCompressor = UglifyCompressor;
