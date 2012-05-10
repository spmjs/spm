// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview Annotation Parser.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


var Annotation = exports;


/**
 * Annotation tokens. You can replace it for customization.
 */
Annotation.TOKENS = [
  /^(?:\/\*\*|\*\/|\*\s?)\s*(.*)\s*/,
  /^@(\b\w+\b)\s?(.+)$/
];


/**
 * Parse input text to annotation object.
 * @param {String} inputFile The input file.
 * @returns {Object} The annotation object.
 */
Annotation.parse = function(inputFile, charset) {
  var text = getText(inputFile, charset);
  var lines = [];

  // get annotation lines
  text.split(/\n|\r/).forEach(function(line) {
    var m = line.trim().match(Annotation.TOKENS[0]);
    if (m && m[1]) {
      lines.push(m[1]);
    }
  });

  // convert to object
  var o = {}, lastKey;
  lines.forEach(function(line) {
    var m = line.match(Annotation.TOKENS[1]);
    if (m) {
      var key = m[1];
      var value = m[2];

      if (o[key]) {
        if (!Array.isArray(o[key])) {
          o[key] = [o[key]];
        }
        o[key].push(value);
      }
      else {
        if (value === '[]') {
          value = [];
        }
        o[key] = value;
      }

      lastKey = key;
    }
    else if (lastKey) {
      var item = o[lastKey];
      if (Array.isArray(item)) {
        item[item.length - 1] += line;
      }
      else {
        o[lastKey] += ' ' + line;
      }
    }
  });

  return o;
};


function getText(inputFile, charset) {
  return require('fs').readFileSync(inputFile, charset || 'utf8');
}
