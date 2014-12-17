
// name@version
var ID_REGEX = /^([a-z][a-z0-9\-\.]*)(@(.+))?$/;
exports.ID_REGEX = ID_REGEX;

var NAME_REGEX = /^[a-z][a-z0-9\-\.]*$/;
exports.NAME_REGEX = NAME_REGEX;

// resolve uri to meta info
exports.resolve = function(uri) {
  uri = uri.toLowerCase();
  var m = uri.match(ID_REGEX);
  if (m) {
    var name = m[1] || '';
    var version = m[3] || '';
  }
  if (!name && !version) return null;
  return {name: name, version: version};
};
