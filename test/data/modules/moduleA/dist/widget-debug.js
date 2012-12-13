define("test/moduleA/0.9.17/daparser-debug", [ "$-debug" ], function(require, exports) {
    // DAParser
    // --------
    // data api 解析器，提供对 block 块和单个 element 的解析，并可用来自动初始化页面中
    // 的所有 Widget 组件。
    var $ = require("$-debug");
    var ATTR_DA_CID = "data-daparser-cid";
    var DAParser = exports;
    // 输入是 DOM element，假设 html 为
    //
    //   <div data-widget="Dialog">
    //     <h3 data-role="title">...</h3>
    //     <ul data-role="content">
    //       <li data-role="item">...</li>
    //       <li data-role="item">...</li>
    //     </ul>
    //     <span data-action="click close">X</span>
    //   </div>
    //
    // 输出是
    //
    //  {
    //     "widget": { "Dialog": ".daparser-0" }
    //     "role": {
    //        "title": ".daparser-1",
    //        "content": ".daparser-2",
    //        "role": ".daparser-3,.daparser-4",
    //     },
    //     "action": {
    //        "click close": ".daparser-5"
    //     }
    //  }
    //
    // 有 data-* 的节点，会自动加上 class="daparser-n"
    //
    DAParser.parseBlock = function(root) {
        root = $(root)[0];
        var stringMap = {};
        // 快速判断 dataset 是否为空，减少无 data-* 时的性能损耗
        if (!hasDataAttrs(root)) return stringMap;
        var elements = makeArray(root.getElementsByTagName("*"));
        elements.unshift(root);
        for (var i = 0, len = elements.length; i < len; i++) {
            var element = elements[i];
            var dataset = DAParser.parseElement(element);
            var cid = element.getAttribute(ATTR_DA_CID);
            for (var key in dataset) {
                // 给 dataset 不为空的元素设置 uid
                if (!cid) {
                    cid = DAParser.stamp(element);
                }
                var val = dataset[key];
                var o = stringMap[key] || (stringMap[key] = {});
                // 用 selector 的形式存储
                o[val] || (o[val] = "");
                o[val] += (o[val] ? "," : "") + "." + cid;
            }
        }
        return stringMap;
    };
    // 得到某个 DOM 元素的 dataset
    DAParser.parseElement = function(element) {
        element = $(element)[0];
        // ref: https://developer.mozilla.org/en/DOM/element.dataset
        if (element.dataset) {
            // 转换成普通对象返回
            return $.extend({}, element.dataset);
        }
        var dataset = {};
        var attrs = element.attributes;
        for (var i = 0, len = attrs.length; i < len; i++) {
            var attr = attrs[i];
            var name = attr.name;
            if (name.indexOf("data-") === 0) {
                name = camelCase(name.substring(5));
                dataset[name] = attr.value;
            }
        }
        return dataset;
    };
    // 给 DOM 元素添加具有唯一性质的 className
    DAParser.stamp = function(element) {
        element = $(element)[0];
        var cid = element.getAttribute(ATTR_DA_CID);
        if (!cid) {
            cid = uniqueId();
            element.setAttribute(ATTR_DA_CID, cid);
            element.className += " " + cid;
        }
        return cid;
    };
    // Helpers
    // ------
    function makeArray(o) {
        var arr = [];
        for (var i = 0, len = o.length; i < len; i++) {
            var node = o[i];
            // 过滤掉注释等节点
            if (node.nodeType === 1) {
                arr.push(node);
            }
        }
        return arr;
    }
    function hasDataAttrs(element) {
        var outerHTML = element.outerHTML;
        // 大部分浏览器已经支持 outerHTML
        if (outerHTML) {
            return outerHTML.indexOf(" data-") !== -1;
        }
        // 看子元素里是否有 data-*
        var innerHTML = element.innerHTML;
        if (innerHTML && innerHTML.indexOf(" data-") !== -1) {
            return true;
        }
        // 判断自己是否有 data-*
        var dataset = DAParser.parseElement(element);
        //noinspection JSUnusedLocalSymbols
        for (var p in dataset) {
            return true;
        }
        return false;
    }
    // 仅处理字母开头的，其他情况仅作小写转换："data-x-y-123-_A" --> xY-123-_a
    var RE_DASH_WORD = /-([a-z])/g;
    function camelCase(str) {
        return str.toLowerCase().replace(RE_DASH_WORD, function(all, letter) {
            return (letter + "").toUpperCase();
        });
    }
    var idCounter = 0;
    function uniqueId() {
        return "daparser-" + idCounter++;
    }
});

define("test/moduleA/0.9.17/auto-render-debug", [ "$-debug" ], function(require, exports) {
    var $ = require("$-debug");
    // 自动渲染接口，子类可根据自己的初始化逻辑进行覆盖
    exports.autoRender = function(config) {
        new this(config).render();
    };
    // 根据 data-widget 属性，自动渲染所有开启了 data-api 的 widget 组件
    exports.autoRenderAll = function(root) {
        root = $(root || document.body);
        var modules = [];
        var elements = [];
        root.find("[data-widget]").each(function(i, element) {
            if (!exports.isDataApiOff(element)) {
                modules.push(element.getAttribute("data-widget").toLowerCase());
                elements.push(element);
            }
        });
        if (modules.length) {
            require.async(modules, function() {
                for (var i = 0; i < arguments.length; i++) {
                    var SubWidget = arguments[i];
                    var element = elements[i];
                    if (SubWidget.autoRender) {
                        SubWidget.autoRender({
                            element: element,
                            renderType: "auto"
                        });
                    }
                }
            });
        }
    };
    var isDefaultOff = $(document.body).attr("data-api") === "off";
    // 是否没开启 data-api
    exports.isDataApiOff = function(element) {
        var elementDataApi = $(element).attr("data-api");
        // data-api 默认开启，关闭只有两种方式：
        //  1. element 上有 data-api="off"，表示关闭单个
        //  2. document.body 上有 data-api="off"，表示关闭所有
        return elementDataApi === "off" || elementDataApi !== "on" && isDefaultOff;
    };
});

define("test/moduleA/0.9.17/widget-debug", [ "./daparser-debug", "./auto-render-debug", "arale/base/1.0.1/base-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug", "$-debug" ], function(require, exports, module) {
    // Widget
    // ---------
    // Widget 是与 DOM 元素相关联的非工具类组件，主要负责 View 层的管理。
    // Widget 组件具有四个要素：描述状态的 attributes 和 properties，描述行为的 events
    // 和 methods。Widget 基类约定了这四要素创建时的基本流程和最佳实践。
    var Base = require("arale/base/1.0.1/base-debug");
    var $ = require("$-debug");
    var DAParser = require("./daparser-debug");
    var AutoRender = require("./auto-render-debug");
    var DELEGATE_EVENT_NS = ".delegate-events-";
    var ON_RENDER = "_onRender";
    var Widget = Base.extend({
        // config 中的这些键值会直接添加到实例上，转换成 properties
        propsInAttrs: [ "element", "template", "model", "events" ],
        // 与 widget 关联的 DOM 元素
        element: null,
        // 默认模板
        template: "<div></div>",
        // 默认数据模型
        model: null,
        // 事件代理，格式为：
        //   {
        //     'mousedown .title': 'edit',
        //     'click {{attrs.saveButton}}': 'save'
        //     'click .open': function(ev) { ... }
        //   }
        events: null,
        // 属性列表
        attrs: {
            // 基本属性
            id: "",
            className: "",
            style: {},
            // 组件的默认父节点
            parentNode: document.body
        },
        // 初始化方法，确定组件创建时的基本流程：
        // 初始化 attrs --》 初始化 props --》 初始化 events --》 子类的初始化
        initialize: function(config) {
            this.cid = uniqueCid();
            // 初始化 attrs
            var dataAttrsConfig = this._parseDataAttrsConfig(config);
            this.initAttrs(config, dataAttrsConfig);
            // 初始化 props
            this.parseElement();
            this._parseDataset();
            this.initProps();
            // 初始化 events
            this.delegateEvents();
            // 子类自定义的初始化
            this.setup();
        },
        // 解析通过 data-attr 设置的 api
        _parseDataAttrsConfig: function(config) {
            var dataAttrsConfig;
            if (config) {
                var element = $(config.element);
            }
            // 解析 data-api 时，只考虑用户传入的 element，不考虑来自继承或从模板构建的
            if (element && element[0] && !AutoRender.isDataApiOff(element)) {
                dataAttrsConfig = DAParser.parseElement(element);
                normalizeConfigValues(dataAttrsConfig);
            }
            return dataAttrsConfig;
        },
        // 构建 this.element
        parseElement: function() {
            var element = this.element;
            if (element) {
                this.element = $(element);
            } else if (this.get("template")) {
                this.parseElementFromTemplate();
            }
            // 如果对应的 DOM 元素不存在，则报错
            if (!this.element || !this.element[0]) {
                throw new Error("element is invalid");
            }
        },
        // 从模板中构建 this.element
        parseElementFromTemplate: function() {
            this.element = $(this.get("template"));
        },
        // 解析 this.element 中的 data-* 配置，获得 this.dataset
        // 并自动将 data-action 配置转换成事件代理
        _parseDataset: function() {
            if (AutoRender.isDataApiOff(this.element)) return;
            this.dataset = DAParser.parseBlock(this.element);
            var actions = this.dataset.action;
            if (actions) {
                var events = getEvents(this) || (this.events = {});
                parseDataActions(actions, events);
            }
        },
        // 负责 properties 的初始化，提供给子类覆盖
        initProps: function() {},
        // 注册事件代理
        delegateEvents: function(events, handler) {
            events || (events = getEvents(this));
            if (!events) return;
            // 允许使用：widget.delegateEvents('click p', function(ev) { ... })
            if (isString(events) && isFunction(handler)) {
                var o = {};
                o[events] = handler;
                events = o;
            }
            // key 为 'event selector'
            for (var key in events) {
                if (!events.hasOwnProperty(key)) continue;
                var args = parseEventKey(key, this);
                var eventType = args.type;
                var selector = args.selector;
                (function(handler, widget) {
                    var callback = function(ev) {
                        if (isFunction(handler)) {
                            handler.call(widget, ev);
                        } else {
                            widget[handler](ev);
                        }
                    };
                    // delegate
                    if (selector) {
                        widget.element.on(eventType, selector, callback);
                    } else {
                        widget.element.on(eventType, callback);
                    }
                })(events[key], this);
            }
            return this;
        },
        // 卸载事件代理
        undelegateEvents: function(eventKey) {
            var args = {};
            // 卸载所有
            if (arguments.length === 0) {
                args.type = DELEGATE_EVENT_NS + this.cid;
            } else {
                args = parseEventKey(eventKey, this);
            }
            this.element.off(args.type, args.selector);
            return this;
        },
        // 提供给子类覆盖的初始化方法
        setup: function() {},
        // 将 widget 渲染到页面上
        // 渲染不仅仅包括插入到 DOM 树中，还包括样式渲染等
        // 约定：子类覆盖时，需保持 `return this`
        render: function() {
            // 让渲染相关属性的初始值生效，并绑定到 change 事件
            if (!this.rendered) {
                this._renderAndBindAttrs();
                this.rendered = true;
            }
            // 插入到文档流中
            var parentNode = this.get("parentNode");
            if (parentNode && !isInDocument(this.element[0])) {
                this.element.appendTo(parentNode);
            }
            return this;
        },
        // 让属性的初始值生效，并绑定到 change:attr 事件上
        _renderAndBindAttrs: function() {
            var widget = this;
            var attrs = widget.attrs;
            for (var attr in attrs) {
                if (!attrs.hasOwnProperty(attr)) continue;
                var m = ON_RENDER + ucfirst(attr);
                if (this[m]) {
                    var val = this.get(attr);
                    // 让属性的初始值生效。注：默认空值不触发
                    if (!isEmptyAttrValue(val)) {
                        this[m](this.get(attr), undefined, attr);
                    }
                    // 将 _onRenderXx 自动绑定到 change:xx 事件上
                    (function(m) {
                        widget.on("change:" + attr, function(val, prev, key) {
                            widget[m](val, prev, key);
                        });
                    })(m);
                }
            }
        },
        _onRenderId: function(val) {
            this.element.attr("id", val);
        },
        _onRenderClassName: function(val) {
            this.element.addClass(val);
        },
        _onRenderStyle: function(val) {
            this.element.css(val);
        },
        // 在 this.element 内寻找匹配节点
        $: function(selector) {
            return this.element.find(selector);
        },
        destroy: function() {
            this.undelegateEvents();
            Widget.superclass.destroy.call(this);
        }
    });
    Widget.autoRender = AutoRender.autoRender;
    Widget.autoRenderAll = AutoRender.autoRenderAll;
    Widget.StaticsWhiteList = [ "autoRender" ];
    module.exports = Widget;
    // Helpers
    // ------
    var toString = Object.prototype.toString;
    var cidCounter = 0;
    function uniqueCid() {
        return "widget-" + cidCounter++;
    }
    function isString(val) {
        return toString.call(val) === "[object String]";
    }
    function isFunction(val) {
        return toString.call(val) === "[object Function]";
    }
    function isEmptyObject(o) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) return false;
        }
        return true;
    }
    function trim(s) {
        return s.replace(/^\s*/, "").replace(/\s*$/, "");
    }
    // Zepto 上没有 contains 方法
    var contains = $.contains || function(a, b) {
        return !!(a.compareDocumentPosition(b) & 16);
    };
    function isInDocument(element) {
        return contains(document.documentElement, element);
    }
    function ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }
    var JSON_LITERAL_PATTERN = /^\s*[\[{].*[\]}]\s*$/;
    var parseJSON = this.JSON ? JSON.parse : $.parseJSON;
    // 解析并归一化配置中的值
    function normalizeConfigValues(config) {
        for (var p in config) {
            if (config.hasOwnProperty(p)) {
                var val = config[p];
                if (!isString(val)) continue;
                if (JSON_LITERAL_PATTERN.test(val)) {
                    val = val.replace(/'/g, '"');
                    config[p] = normalizeConfigValues(parseJSON(val));
                } else {
                    config[p] = normalizeConfigValue(val);
                }
            }
        }
        return config;
    }
    // 将 'false' 转换为 false
    // 'true' 转换为 true
    // '3253.34' 转换为 3253.34
    function normalizeConfigValue(val) {
        if (val.toLowerCase() === "false") {
            val = false;
        } else if (val.toLowerCase() === "true") {
            val = true;
        } else if (/\d/.test(val) && /[^a-z]/i.test(val)) {
            var number = parseFloat(val);
            if (number + "" === val) {
                val = number;
            }
        }
        return val;
    }
    // 解析 data-action，添加到 events 中
    function parseDataActions(actions, events) {
        for (var action in actions) {
            if (!actions.hasOwnProperty(action)) continue;
            // data-action 可以含有多个事件，比如：click x, mouseenter y
            var parts = trim(action).split(/\s*,\s*/);
            var selector = actions[action];
            while (action = parts.shift()) {
                var m = action.split(/\s+/);
                var event = m[0];
                var method = m[1];
                // 默认是 click 事件
                if (!method) {
                    method = event;
                    event = "click";
                }
                events[event + " " + selector] = method;
            }
        }
    }
    // 对于 attrs 的 value 来说，以下值都认为是空值： null, undefined, '', [], {}
    function isEmptyAttrValue(o) {
        return o == null || // null, undefined
        (isString(o) || $.isArray(o)) && o.length === 0 || // '', []
        $.isPlainObject(o) && isEmptyObject(o);
    }
    var EVENT_KEY_SPLITTER = /^(\S+)\s*(.*)$/;
    var EXPRESSION_FLAG = /{{([^}]+)}}/g;
    var INVALID_SELECTOR = "INVALID_SELECTOR";
    function getEvents(widget) {
        if (isFunction(widget.events)) {
            widget.events = widget.events();
        }
        return widget.events;
    }
    function parseEventKey(eventKey, widget) {
        var match = eventKey.match(EVENT_KEY_SPLITTER);
        var eventType = match[1] + DELEGATE_EVENT_NS + widget.cid;
        // 当没有 selector 时，需要设置为 undefined，以使得 zepto 能正确转换为 bind
        var selector = match[2] || undefined;
        if (selector && selector.indexOf("{{") > -1) {
            selector = parseEventExpression(selector, widget);
        }
        return {
            type: eventType,
            selector: selector
        };
    }
    // 将 {{xx}}, {{yy}} 转换成 .daparser-n, .daparser-m
    function parseEventExpression(selector, widget) {
        return selector.replace(EXPRESSION_FLAG, function(m, name) {
            var parts = name.split(".");
            var point = widget, part;
            while (part = parts.shift()) {
                if (point === widget.attrs) {
                    point = widget.get(part);
                } else {
                    point = point[part];
                }
            }
            // 已经是 className，比如来自 dataset 的
            if (isString(point)) {
                return point;
            }
            // 看是否是 element
            var element = $(point)[0];
            if (element && element.nodeType === 1) {
                return "." + DAParser.stamp(element);
            }
            // 不能识别的，返回无效标识
            return INVALID_SELECTOR;
        });
    }
});