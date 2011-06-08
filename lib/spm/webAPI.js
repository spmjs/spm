// vim: set tabstop=2 shiftwidth=2:

var fs = require('fs');

const dataJS = 'html/data.js';

function generate(newData) {
  var oldData = readOrignalDatq(),
      names = [],
      dones = {},
      data = [];

  function prepareNames(o) {
    if (names.indexOf(o.name) == -1) {
      names.push(o.name);
      dones[o.name] = false;
    }
  }

  oldData.forEach(prepareNames);
  newData.forEach(prepareNames);

  names.forEach(function(name) {
    newData.forEach(function(o) {
      if (!dones[name] && o.name == name) {
        data.push(o);
        dones[name] = true;
        return;
      }

      oldData.forEach(function(k) {
        if (!dones[name] && k.name === name) {
          data.push(o);
          dones[name] = true;
          return;
        }
      });
    });
  });

  var out = 'define(' + JSON.stringify(data) + ');';
  fs.writeFileSync(dataJS, out, 'utf-8');
}

function readOrignalDatq() {
  var data = fs.readFileSync(dataJS).toString();
  data = data.replace(/define\(([\s\S]+)\);/, '$1');
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

exports.generate = generate;
