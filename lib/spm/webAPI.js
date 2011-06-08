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

function generate(newData) {
  newData.forEach(prepareNames);

  for (var i = 0, l = names.length; i < l; i++) {
    var name = names[i];
    for (var j = 0, k = newData.length; j < k; j++) {
      var o = newData[j];
      if (!dones[name] && o.name === name) {
        data.push(o);
        dones[name] = true;
        break;
      }

      for (var m = 0, n = oldData.length; m < n; m++) {
        if (!dones[name] && o.name === name) {
          o = oldData[m];
          data.push(o);
          dones[name] = true;
          break;
        }
      }
    }
  }

  var out = 'define(' + JSON.stringify(data) + ');';
  fs.writeFileSync(dataJS, out, 'utf-8');
}

exports.generate = generate;
