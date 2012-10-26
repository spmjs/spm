define(function(require, exports) {
    exports.random = function(min, max){
        return min + Math.round(Math.random() * (max - min));
    };
});
