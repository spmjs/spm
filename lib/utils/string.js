/**
 * @author lifesinger@gmail.com (Frank Wang)
 */


exports.capitalize = function(str) {
  if (typeof str !== 'string' || str === '') {
    return '';
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
