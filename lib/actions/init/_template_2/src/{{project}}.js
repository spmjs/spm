define(function(require, exports, module) {

    var Widget = require('widget');
    var Templatable = require('templatable');

    var {{project}} = module.exports = Widget.extend({

        attrs: {
            'height': {
                value: 200,
                getter: function(val) {
                    return parseInt(val);
                }
            },
            'padding': {
                value: 30,
                getter: function(val) {
                    return parseInt(val);
                }
            },
            'color': 'red'
        },

        Implements: Templatable,

        template: '<div id="b" class="widget"><h3>{{title}}</h3><p>{{content}}</p></div>',

        model: {
            title: '我是默认标题',
            content: '我是默认内容'
        },

        events: {
            'click': 'animate'
        },

        animate: function() {
            this.$('p').slideToggle('slow');
        },

        setup: function() {
            this.$('p').css({
                'height': this.get('height'),
                'padding': this.get('padding'),
                'backgroundColor': this.get('color')
            });
        }
    });
});

