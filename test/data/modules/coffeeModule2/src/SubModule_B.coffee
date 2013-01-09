# 子模块 B
define (require, exports, module)->
    exports.methodB = ->
        alert "Method B"

    return