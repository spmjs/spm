// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager Configuration.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


var fs = require('fs');

const dataJS = 'html/data.js';

var dones = {},
    names = {},
    data = {},
    oldData = readOriginalData();

function prepareNames(o) {
  if (names.indexOf(o.name) == -1) {
    names.push(o.name);
    dones[o.name] = false;
  }
}

oldData.forEach(prepareNames);

function inData(o, name) {
  return name in o;
}

function generate(newData) {
  newData.forEach(prepareNames);

  for (var i = 0, l = names.length; i < l; i++) {
    var name = names[i], o;

    for (var m = 0, n = oldData.length; m < n; m++) {
      o = oldData[m];
      if (!dones[name] &&
          o.name === name &&
          inData(newData, name) === -1) {
        data.push(o);
        dones[name] = true;
        break;
      }
    }

    for (var j = 0, k = newData.length; j < k; j++) {
      o = newData[j];
      if (!dones[name] && o.name === name) {
        data.push(o);
        dones[name] = true;
        break;
      }
    }

  }

  oldData = data;

  var out = 'define(' + JSON.stringify(data) + ');';
  fs.writeFileSync(dataJS, out, 'utf-8');
}

function remove(mod) {
  for (var i = 0, l = names.length; i < l; i++) {
    var name = names[i], o;

    for (var m = 0, n = oldData.length; m < n; m++) {
      o = oldData[m];
      if (!dones[name] && o.name === name && name !== mod) {
        data.push(o);
        dones[name] = true;
        break;
      }
    }

    var out = 'define(' + JSON.stringify(data) + ');';
    fs.writeFileSync(dataJS, out, 'utf-8');
  }
}

exports.generate = generate;
exports.remove = remove;
