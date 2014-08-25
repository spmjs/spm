;
(function() {
  var d_010_index_debug, b_110_src_b_debugtpl, b_110_src_extra_debug, d_011_index_debug, c_111_index_debug, b_110_src_b_debug, a_100_relative_debug, a_100_index_debug;
  d_010_index_debug = function(exports) {
    exports.d = function() {
      console.log('0.1.0');
    };
    return exports;
  }({});
  b_110_src_b_debugtpl = function(exports) {
    exports = '<div></div>';
    return exports;
  }();
  b_110_src_extra_debug = function() {
    console.log('b-extra');
  }();
  d_011_index_debug = function(exports) {
    exports.d = function() {
      console.log('0.1.1');
    };
    return exports;
  }({});
  c_111_index_debug = function() {
    d_010_index_debug;
  }();
  b_110_src_b_debug = function() {
    c_111_index_debug;
    b_110_src_b_debugtpl;
  }();
  a_100_relative_debug = function() {
    console.log('relative');
    b_110_src_b_debug;
    b_110_src_extra_debug;
  }();
  a_100_index_debug = function() {
    a_100_relative_debug;
    d_011_index_debug;
  }();
}());