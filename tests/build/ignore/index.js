(function() {
  var _rng;
  if (typeof require === 'function') {
    try {
      var _rb = require('crypto').randomBytes;
      _rng = _rb && function() {
        return _rb(16);
      };
    } catch (e) {}
  }
})();
