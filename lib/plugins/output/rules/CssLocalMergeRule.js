var path = require('path');
var util = require('util');
var fsExt = require('../utils/fs_ext.js');

var moduleHelp = require('../utils/module_help.js');

var isCss = moduleHelp.isCss;

var cssLocalMergeRule = Rule.createRule('CssLocalMergeRule');

cssLocalMergeRule.check = function(filename, includes) {
  return isCss(filename) && includes === '.';
};

cssLocalMergeRule.getIncludes = function(handler, filename, includes, callback) {
  callback(includes);
};

cssLocalMergeRule.output = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var build = project.buildDirectory;
  var dist = project.distDirectory;
  // @import "./m1.css";
  // @import url("https://a.alipayobjects.com/al/alice.common.homeindexSimple-1.3.css");
  var importReg = /@import\s*(?:url)?\(?['|"]([^'"]+)\.css['|"]\)?[^;]*;/ig;

  var outputFilePath = path.join(dist, filename);
  var code = fsExt.readFileSync(path.join(build, filename));
  // code = CleanCSS._stripComments({}, code);
  var result;
  while((result = importReg.exec(code)) !== null) {
    var cssMod = result[1];

    if (isRelative(cssMod)) {
      code += fsExt.readFileSync(path.join(build, cssMod + '.css'));
    }
    console.info('result------>', result[1], result[0], result[2]); 
    console.info('-----')
  }

  if (project.debugName) {
    var debugOutputFilePath = path.join(dist,
          moduleHelp.getBaseModule(filename) + '-' + project.debugName + '.css');
    fsExt.writeFileSync(debugOutputFilePath, code); 
  }
  fsExt.writeFileSync(outputFilePath, code);
};

function getImportStyle(base, code) {

}


