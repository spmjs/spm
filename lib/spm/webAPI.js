// vim: set tabstop=2 shiftwidth=2:

var fs = require('fs');

const dataJS = 'html/data.js';

function readOriginalData() {
  var data = fs.readFileSync(dataJS).toString();
  data = data.replace(/define\(([\s\S]+)\);/, '$1');
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

var dones = {},
    names = [],
    data = [],
    oldData = readOriginalData();

function prepareNames(o) {
  if (names.indexOf(o.name) == -1) {
    names.push(o.name);
    dones[o.name] = false;
  }
}

oldData.forEach(prepareNames);

function inData(arr, name) {
  for (var i = 0, l = arr.length; i < l; i++) {
    if (arr[i].name === name) {
      return i;
    }
  }
  return -1;
}

function generate(newData) {
  newData.forEach(prepareNames);

  for (var i = 0, l = names.length; i < l; i++) {
    var name = names[i], o;

    for (var m = 0, n = oldData.length; m < n; m++) {
      o = oldData[m];
      if (!dones[name] && o.name === name && inData(newData, name)) {
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

  var out = 'define(' + JSON.stringify(data) + ');';
  fs.writeFileSync(dataJS, out, 'utf-8');
}

exports.generate = generate;
