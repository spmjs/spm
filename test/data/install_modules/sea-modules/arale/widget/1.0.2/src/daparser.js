define(function(require, DAParser) {

  // DAParser
  // --------
  // data api 解析器，提供对单个 element 的解析，可用来初始化页面中的所有 Widget 组件。

  var $ = require('$')


  // 得到某个 DOM 元素的 dataset
  DAParser.parseElement = function(element, raw) {
    element = $(element)[0]
    var dataset = {}

    // ref: https://developer.mozilla.org/en/DOM/element.dataset
    if (element.dataset) {
      // 转换成普通对象
      dataset = $.extend({}, element.dataset)
    }
    else {
      var attrs = element.attributes

      for (var i = 0, len = attrs.length; i < len; i++) {
        var attr = attrs[i]
        var name = attr.name

        if (name.indexOf('data-') === 0) {
          name = camelCase(name.substring(5))
          dataset[name] = attr.value
        }
      }
    }

    return raw === true ? dataset : normalizeValues(dataset)
  }


  // Helpers
  // ------

  var RE_DASH_WORD = /-([a-z])/g
  var JSON_LITERAL_PATTERN = /^\s*[\[{].*[\]}]\s*$/
  var parseJSON = this.JSON ? JSON.parse : $.parseJSON

  // 仅处理字母开头的，其他情况转换为小写："data-x-y-123-_A" --> xY-123-_a
  function camelCase(str) {
    return str.toLowerCase().replace(RE_DASH_WORD, function(all, letter) {
      return (letter + '').toUpperCase()
    })
  }

  // 解析并归一化配置中的值
  function normalizeValues(data) {
    for (var key in data) {
      if (data.hasOwnProperty(key)) {

        var val = data[key]
        if (typeof val !== 'string') continue

        if (JSON_LITERAL_PATTERN.test(val)) {
          val = val.replace(/'/g, '"')
          data[key] = normalizeValues(parseJSON(val))
        }
        else {
          data[key] = normalizeValue(val)
        }
      }
    }

    return data
  }

  // 将 'false' 转换为 false
  // 'true' 转换为 true
  // '3253.34' 转换为 3253.34
  function normalizeValue(val) {
    if (val.toLowerCase() === 'false') {
      val = false
    }
    else if (val.toLowerCase() === 'true') {
      val = true
    }
    else if (/\d/.test(val) && /[^a-z]/i.test(val)) {
      var number = parseFloat(val)
      if (number + '' === val) {
        val = number
      }
    }

    return val
  }

});
