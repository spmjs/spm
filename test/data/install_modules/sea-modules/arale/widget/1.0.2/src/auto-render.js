define(function(require, exports) {

  var $ = require('$')
  var DATA_WIDGET_AUTO_RENDERED = 'data-widget-auto-rendered'


  // 自动渲染接口，子类可根据自己的初始化逻辑进行覆盖
  exports.autoRender = function(config) {
    return new this(config).render()
  }


  // 根据 data-widget 属性，自动渲染所有开启了 data-api 的 widget 组件
  exports.autoRenderAll = function(root, callback) {
    if (typeof root === 'function') {
      callback = root
      root = null
    }

    root = $(root || document.body)
    var modules = []
    var elements = []

    root.find('[data-widget]').each(function(i, element) {
      if (!exports.isDataApiOff(element)) {
        modules.push(element.getAttribute('data-widget').toLowerCase())
        elements.push(element)
      }
    })

    if (modules.length) {
      seajs.use(modules, function() {

        for (var i = 0; i < arguments.length; i++) {
          var SubWidget = arguments[i]
          var element = $(elements[i])

          // 已经渲染过
          if (element.attr(DATA_WIDGET_AUTO_RENDERED)) continue

          // 调用自动渲染接口
          SubWidget.autoRender && SubWidget.autoRender({
            element: element,
            renderType: 'auto'
          })

          // 标记已经渲染过
          element.attr(DATA_WIDGET_AUTO_RENDERED, 'true')
        }

        // 在所有自动渲染完成后，执行回调
        callback && callback()
      })
    }
  }


  var isDefaultOff = $(document.body).attr('data-api') === 'off'

  // 是否没开启 data-api
  exports.isDataApiOff = function(element) {
    var elementDataApi = $(element).attr('data-api')

    // data-api 默认开启，关闭只有两种方式：
    //  1. element 上有 data-api="off"，表示关闭单个
    //  2. document.body 上有 data-api="off"，表示关闭所有
    return  elementDataApi === 'off' ||
        (elementDataApi !== 'on' && isDefaultOff)
  }

});
