/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

'use strict';

exports.capitalize = function(str) {
  if (typeof str !== 'string' || str === '') {
    return '';
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

exports.camelStr = function(str) {
  return str.replace(/([a-zA-Z])-([a-zA-Z])/g, function(match, s1, s2) {
    return s1 + s2.toUpperCase();
  });
};

exports.bigCamelStr = function(str) {
  if (/[a-zA-Z]-[a-zA-Z]/.test(str)) {
    str = exports.camelStr(str);
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }
  return str;
};

exports.splitCamelStr = function(str) {
  return str.replace(/([a-z])([A-Z])/g, function(match, s1, s2) {
    return s1 + '-' + s2.toLowerCase();
  });
};

exports.endWith = function(src, str) {
  if (src.indexOf(str) < 0) return false;
  if (src.lastIndexOf(str) === (src.length - str.length)) return true;
  return false;
};

var tmplReg = /\{\{([^}]+)\}\}/g;

exports.hasTmpl = function(str) {
  return /\{\{([^}]+)\}\}/.test(str);
};

exports.tmpl = function(str, obj) {
  return str.replace(tmplReg, function(match, key) {
    var value = obj;

    if (key.indexOf('.') > -1) {
      var keys = key.split('.');

      while(keys.length > 0) {
        value = value[keys.shift()]; 

        if (!value) {
          return '';
        }
      }

      return exports.tmpl(value, obj);
    } else if (typeof obj[key] !== 'undefined') {
      return obj[key];
    } else {
      return match;
    }
  });
};
