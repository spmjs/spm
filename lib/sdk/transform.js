// transform tpl to js
var fs = require('fs-extra');
var util = require('util');
var path = require('path');
var logging = require('colorful').logging;
var paint = require('colorful').paint;
var ast = require('./ast');
var iduri = require('./iduri');
var module = require('./module');
var pathlib = require('../utils/pathlib');

exports.transform = transform;

function transform(src, dest, pkg) {
  // pkg means everything in package.json,
  // and something else for generating id.
  var files = pathlib.walkdirSync(src);
  var encoding = pkg.encoding || 'utf8';

  var fname, id, data, destfile;
  files.forEach(function(fpath) {
    logging.debug('transform', fpath);
    fname = fpath.replace(src, '').replace(/^\//, '');
    id = getId(pkg, fname);
    destfile = path.join(dest, fname);
    if (/\.js$/.test(fname)) {
      data = compilejs(fpath, fname, pkg);
      pathlib.writeFileSync(destfile, data);
    } else if (/\.css$/.test(fname)) {
      data = fs.readFileSync(fpath, encoding);
      data = css2js(data, id);
      pathlib.writeFileSync(destfile + '.js', data);
    } else if (/\.tpl$/.test(fname)) {
      data = fs.readFileSync(fpath, encoding);
      data = tpl2js(data, id);
      pathlib.writeFileSync(destfile + '.js', data);
    } else if (/\.json$/.test(fname)) {
      data = fs.readFileSync(fpath, encoding);
      data = json2js(data, id);
      pathlib.writeFileSync(destfile + '.js', data);
    } else {
      // TODO copy
    }
  });
}

function compilejs(fpath, fname, pkg) {
  var data = fs.readFileSync(fpath, pkg.encoding || 'utf8');
  var astCache = ast.getAst(data);

  var isBuilded = ast.parseDefines(astCache)[0].id;
  if (isBuilded) {
    // if user defined dependencies himself, we should not parse
    return data;
  }
  var deps = module.parseDependencies(fpath, pkg);

  if (deps.length) {
    logging.debug(fpath, '=>', paint(deps).magenta.color);
  }

  data = ast.replaceRequire(astCache, function(value) {
    return iduri.generateId(pkg, value);
  });

  var id = getId(pkg, fname);
  iduri.validateId(id);
  return ast.replaceDefine(data, id, deps);
}

function tpl2js(code, id) {
  // TODO minifier code
  code = util.format('define("%s", [], "%s")', id, code.replace(/\"/g, '\\\"'));
  return ast.getAst(code).print_to_string();
}

// transform css to js
function css2js(code, id) {
  // #581
  var tpl = [
    'define("%s", [], function() {',
    'function importStyle(cssText) {',
    'var element = document.createElement("style");',
    'doc.getElementsByTagName("head")[0].appendChild(element);',
    'if (element.styleSheet) {',
    'element.styleSheet.cssText = cssText;',
    '} else {',
    'element.appendChild(doc.createTextNode(cssText));',
    '}',
    '}',
    'importStyle("%s")',
    '});'
  ].join('\n');
  // TODO minifier code
  code = util.format(tpl, id, code.replace(/\"/g, '\\\"'));
  return ast.getAst(code).print_to_string();
}


// transform json to js
function json2js(code, id) {
}


function getId(pkg, fname) {
  pkg.filename = fname;
  return iduri.generateId(pkg);
}
