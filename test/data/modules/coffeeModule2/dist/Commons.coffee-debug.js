(function() {
    define("test/coffee-module2/1.0.0/SubModule_A.coffee-debug", [], function(require, exports, module) {
        exports.methodA = function() {
            return alert("Method A");
        };
    });
}).call(this);

(function() {
    define("test/coffee-module2/1.0.0/SubModule_B.coffee-debug", [], function(require, exports, module) {
        exports.methodB = function() {
            return alert("Method B");
        };
    });
}).call(this);

(function() {
    define("test/coffee-module2/1.0.0/Commons.coffee-debug", [ "./SubModule_A.coffee-debug", "./SubModule_B.coffee-debug" ], function(require, exports, module) {
        var subModuleA, subModuleB;
        subModuleA = require("./SubModule_A.coffee-debug.js");
        subModuleB = require("./SubModule_B.coffee-debug.js");
        exports.doSomething = function() {
            subModuleA.methodA();
            subModuleB.methodB();
            return alert("OK");
        };
    });
}).call(this);