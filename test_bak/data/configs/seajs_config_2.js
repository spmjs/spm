(function() {

  seajs.config();

  seajs.config(2);

  seajs.config({
    timeout: 5000
  });

  seajs.config({
    alias: {
      'increment': 'increment.js?t=20110530',
      'lib': './lib'
    }
  });

  (function() {
    seajs.config({
      alias: {
        'underscore': 'underscore/1.1.6/underscore'
      },
      debug: true
    });
  })();

})();
