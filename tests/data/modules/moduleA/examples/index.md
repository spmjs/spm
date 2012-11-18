<style>
    .widget {
        zoom: 1;
        display: inline;
        display: inline-block;
        border: 1px solid #ccc;
        padding: 20px;
        min-width: 300px;
    }

    #example3 li {
        list-style: none;
        clear: both;
    }

    #example3 li a {
        float: left;
    }

    #example3 .remove {
        float: right;
        text-decoration: none;
        color: red;
    }

    #example4 .action {
        padding: 0 20px
    }

    #example4 .action a {
        padding: 0 10px
    }
</style>

<div id="a" class="widget">
    <h3>我是标题，请点击我一下。</h3>
    <p>我是段落，请将鼠标悬浮在我上面，我会变色的。</p>
</div>

```javascript
seajs.use(['../src/widget', '../src/templatable', 'handlebars', '$'], function(Widget, Templatable, Handlebars, $) {

    // for debug
    this.$ = $;

    // example1: 简单的事件代理
    // -------------------------------
    var WidgetA = Widget.extend({

        events: {
            'click h3': 'heading',
            'mouseover p': 'paragraph'
        },

        heading: function() {
            this.$('h3').html('标题被点击了。');
        },

        paragraph: function() {
            this.$('p').css('background-color', 'red');
        }
    });

    var a = new WidgetA({ element: '#a' });
});
```

<div id="example2" class="example">

</div>

```javascript
seajs.use(['../src/widget', '../src/templatable', 'handlebars', '$'], function(Widget, Templatable, Handlebars, $) {

    // for debug
    this.$ = $;

    // example2: template widget
    // ---------------------------------
    var WidgetB = Widget.extend({

        Implements: Templatable,

        attrs: {
            template: '<div id="b" class="widget"><h3>{{title}}</h3><p>{{content}}</p></div>'
        },

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
                'height': 100,
                'padding': 20,
                'backgroundColor': '#eee'
            });
        }
    });

    var b = new WidgetB({
        model: {
            content: '我是传入的内容，点击我试试'
        },
        parentNode: '#example2'
    }).render();
});
```


<div id="example3" class="example">
    <script id="template-c" type="text/x-handlebars-template">
        <div>
            <h3>{{title}}</h3>
            <ul>{{list items}}</ul>
        </div>
    </script>
</div>

```javascript
seajs.use(['../src/widget', '../src/templatable', 'handlebars', '$'], function(Widget, Templatable, Handlebars, $) {

    // for debug
    this.$ = $;

    // example3: Handlebars.registerHelper
    // ---------------------------------------
    var WidgetC = Widget.extend({

        Implements: Templatable,

        events: {
            'click li .remove': 'remove'
        },

        templateHelpers: {
            'list': function(items) {
                var out = '';

                for (var i = 0, len = items.length; i < len; i++) {
                    var item = items[i];
                    out += '<li><a href="' + item.href + '">' +
                            item.text +
                            '</a><a href="#" class="remove">X</a></li>';
                }

                return new Handlebars.SafeString(out);
            }
        },

        remove: function(event) {
            event.preventDefault();
            $(event.target).parent().remove();
        },

        setup: function() {
            if (this.get('style')) {
                this.element.attr('style', this.get('style'));
            }

            if (this.get('className')) {
                this.element.addClass(this.get('className'));
            }
        }

    });

    var c = new WidgetC({
        className: 'widget',
        titleClassName: 'title',
        style: 'width: 300px',
        model: {
            title: "精品文章列表",
            items: [
                { "href": "http://google.com/", "text": "爱的力量" },
                { "href": "http://google.com/", "text": "天下武功，唯快不破" },
                { "href": "http://google.com/", "text": "开放的意义" },
                { "href": "http://google.com/", "text": "Arale 棒棒的" }
            ]
        },
        template: $('#template-c').html(),
        parentNode: '#example3'
    }).render();
});
```

<div id="example4" class="example">
    <script id="template-d" type="text/x-handlebars-template">
        <div id="d" class="widget">
            <h3 data-action="click toggle">{{title}}</h3>
            <ol data-action="mouseenter focus, mouseleave blur">
                {{#list}}
                <li>{{text}}</li>
                {{/list}}
            </ol>
        </div>
    </script>
</div>

```javascript
seajs.use(['../src/widget', '../src/templatable', 'handlebars', '$'], function(Widget, Templatable, Handlebars, $) {

    // for debug
    this.$ = $;

    // example4: parse data-api
    // ---------------------------------------
    var WidgetD = Widget.extend({

        Implements: Templatable,

        toggle: function() {
            this.$('ol').slideToggle('slow');
        },

        focus: function() {
            this.$('ol').css('backgroundColor', '#eee');
        },

        blur: function() {
            this.$('ol').css('backgroundColor', '');
        }
    });

    var d = new WidgetD({
        template: $('#template-d').html(),

        model: {
            title: "设计原则（点击我）",
            list: [
                {"text": "开放：开源开放，海纳百川。（悬浮上来）"},
                {"text": "简单：如无必要，勿增实体。"},
                {"text": "易用：一目了然，容易学习。"}
            ]
        },

        parentNode: '#example4'

    }).render();
});
```

