#“鹰击”公共模块
define (require, exports, module) ->
    subModuleA = require "./SubModule_A.coffee"
    subModuleB = require "./SubModule_B.coffee"

    exports.doSomething = ->
        subModuleA.methodA()
        subModuleB.methodB()
        alert "OK"

    return
