/**
 * @author lifesinger@gmail.com (Frank Wang)
 */


exports.capitalize = function(str) {
  if (typeof str !== 'string' || str === '') {
    return '';
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

exports.endWith = function(src, str) {
  if (src.indexOf(str) < 0) return false;
  if (src.lastIndexOf(str) === (src.length - str.length)) return true;
  return false;
};
