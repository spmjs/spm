var path = require('path');
var spmrc = require('spmrc');
var file = require('../sdk/file');
var runfile = path.join(spmrc.get('user.home'), '.spm', 'run.json');

function info(name) {
  var data = {};
  if (file.exists(runfile)) {
    data = file.readJSON(runfile);
  }
  if (!name) {
    return data || {};
  }
  return data[name] || {};
}

exports.info = info;

function record(name, options) {
  var data = info();
  var ret = data[name] || {};

  if (options) {
    Object.keys(options).forEach(function(key) {
      ret[key] = options[key];
    });
  }

  ret.name = name;
  if (ret.count) {
    ret.count += 1;
  } else {
    ret.count = 1;
  }
  ret.time = new Date();
  data[name] = ret;
  file.writeJSON(runfile, data);
}

exports.record = record;
