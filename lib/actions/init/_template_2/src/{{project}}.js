define(function(require, exports, module) {

    // add your code

    var $ = require('$');
    var Widget = require('widget'); // var Easing = require('easinging');

    var {{project}} = Widget.extend({

        events: {
            'click .btn': 'say'
        },

        say: function() {
            alert('hello ' + {{project}})
        }
    });
});
