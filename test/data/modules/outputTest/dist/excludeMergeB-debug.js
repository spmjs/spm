define("test/outputTest/0.0.1/a-debug", [], function(require, exports) {
    exports.getA = function(id) {};
});

define("test/outputTest/0.0.1/b-debug", [], function(require, exports) {
    exports.getB = function(id) {};
});

define("test/outputTest/0.0.1/c-debug", [], function(require, exports) {
    exports.getC = function(id) {};
});

define("arale/base/1.0.1/aspect-debug", [], function(require, exports) {

  // Aspect
  // ---------------------
  // Thanks to:
  //  - http://yuilibrary.com/yui/docs/api/classes/Do.html
  //  - http://code.google.com/p/jquery-aop/
  //  - http://lazutkin.com/blog/2008/may/18/aop-aspect-javascript-dojo/


  // 在指定方法执行前，先执行 callback
  exports.before = function(methodName, callback, context) {
    return weave.call(this, 'before', methodName, callback, context);
  };


  // 在指定方法执行后，再执行 callback
  exports.after = function(methodName, callback, context) {
    return weave.call(this, 'after', methodName, callback, context);
  };


  // Helpers
  // -------

  var eventSplitter = /\s+/;

  function weave(when, methodName, callback, context) {
    var names = methodName.split(eventSplitter);
    var name, method;

    while (name = names.shift()) {
      method = getMethod(this, name);
      if (!method.__isAspected) {
        wrap.call(this, name);
      }
      this.on(when + ':' + name, callback, context);
    }

    return this;
  }


  function getMethod(host, methodName) {
    var method = host[methodName];
    if (!method) {
      throw new Error('Invalid method name: ' + methodName);
    }
    return method;
  }


  function wrap(methodName) {
    var old = this[methodName];

    this[methodName] = function() {
      var args = Array.prototype.slice.call(arguments);
      var beforeArgs = ['before:' + methodName].concat(args);

      this.trigger.apply(this, beforeArgs);
      var ret = old.apply(this, arguments);
      this.trigger('after:' + methodName, ret);

      return ret;
    };

    this[methodName].__isAspected = true;
  }

});

define("arale/base/1.0.1/attribute-debug", [], function(require, exports) {

  // Attribute
  // -----------------
  // Thanks to:
  //  - http://documentcloud.github.com/backbone/#Model
  //  - http://yuilibrary.com/yui/docs/api/classes/AttributeCore.html
  //  - https://github.com/berzniz/backbone.getters.setters


  // 负责 attributes 的初始化
  // attributes 是与实例相关的状态信息，可读可写，发生变化时，会自动触发相关事件
  exports.initAttrs = function(config, dataAttrsConfig) {

    // 合并来自 data-attr 的配置
    if (dataAttrsConfig) {
      config = config ? merge(dataAttrsConfig, config) : dataAttrsConfig;
    }

    // Get all inherited attributes.
    var specialProps = this.propsInAttrs || [];
    var inheritedAttrs = getInheritedAttrs(this, specialProps);
    var attrs = merge({}, inheritedAttrs);
    var userValues;

    // Merge user-specific attributes from config.
    if (config) {
      userValues = normalize(config, true);
      merge(attrs, userValues);
    }

    // Automatically register `this._onChangeAttr` method as
    // a `change:attr` event handler.
    parseEventsFromInstance(this, attrs);

    // initAttrs 是在初始化时调用的，默认情况下实例上肯定没有 attrs，不存在覆盖问题
    this.attrs = attrs;

    // 对于有 setter 的属性，要用初始值 set 一下，以保证关联属性也一同初始化
    setSetterAttrs(this, attrs, userValues);

    // Convert `on/before/afterXxx` config to event handler.
    parseEventsFromAttrs(this, attrs);

    // 将 this.attrs 上的 special properties 放回 this 上
    copySpecialProps(specialProps, this, this.attrs, true);
  };


  // Get the value of an attribute.
  exports.get = function(key) {
    var attr = this.attrs[key] || {};
    var val = attr.value;
    return attr.getter ? attr.getter.call(this, val, key) : val;
  };


  // Set a hash of model attributes on the object, firing `"change"` unless
  // you choose to silence it.
  exports.set = function(key, val, options) {
    var attrs = {};

    // set("key", val, options)
    if (isString(key)) {
      attrs[key] = val;
    }
    // set({ "key": val, "key2": val2 }, options)
    else {
      attrs = key;
      options = val;
    }

    options || (options = {});
    var silent = options.silent;

    var now = this.attrs;
    var changed = this.__changedAttrs || (this.__changedAttrs = {});

    for (key in attrs) {
      if (!attrs.hasOwnProperty(key)) continue;

      var attr = now[key] || (now[key] = {});
      val = attrs[key];

      if (attr.readOnly) {
        throw new Error('This attribute is readOnly: ' + key);
      }

      // invoke setter
      if (attr.setter) {
        val = attr.setter.call(this, val, key);
      }

      // 获取设置前的 prev 值
      var prev = this.get(key);

      // 获取需要设置的 val 值
      // 都为对象时，做 merge 操作，以保留 prev 上没有覆盖的值
      if (isPlainObject(prev) && isPlainObject(val)) {
        val = merge(merge({}, prev), val);
      }

      // set finally
      now[key].value = val;

      // invoke change event
      // 初始化时对 set 的调用，不触发任何事件
      if (!this.__initializingAttrs && !isEqual(prev, val)) {
        if (silent) {
          changed[key] = [val, prev];
        }
        else {
          this.trigger('change:' + key, val, prev, key);
        }
      }
    }

    return this;
  };


  // Call this method to manually fire a `"change"` event for triggering
  // a `"change:attribute"` event for each changed attribute.
  exports.change = function() {
    var changed = this.__changedAttrs;

    if (changed) {
      for (var key in changed) {
        if (changed.hasOwnProperty(key)) {
          var args = changed[key];
          this.trigger('change:' + key, args[0], args[1], key);
        }
      }
      delete this.__changedAttrs;
    }

    return this;
  };


  // Helpers
  // -------

  var toString = Object.prototype.toString;
  var hasOwn = Object.prototype.hasOwnProperty;

  var isArray = Array.isArray || function(val) {
    return toString.call(val) === '[object Array]';
  };

  function isString(val) {
    return toString.call(val) === '[object String]';
  }

  function isFunction(val) {
    return toString.call(val) === '[object Function]';
  }

  function isWindow(o) {
    return o != null && o == o.window;
  }

  function isPlainObject(o) {
    // Must be an Object.
    // Because of IE, we also have to check the presence of the constructor
    // property. Make sure that DOM nodes and window objects don't
    // pass through, as well
    if (!o || toString.call(o) !== "[object Object]" ||
        o.nodeType || isWindow(o)) {
      return false;
    }

    try {
      // Not own constructor property must be Object
      if (o.constructor &&
          !hasOwn.call(o, "constructor") &&
          !hasOwn.call(o.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
    } catch (e) {
      // IE8,9 Will throw exceptions on certain host objects #9897
      return false;
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.
    for (var key in o) {}

    return key === undefined || hasOwn.call(o, key);
  }

  function isEmptyObject(o) {
    for (var p in o) {
      if (o.hasOwnProperty(p)) return false;
    }
    return true;
  }

  function merge(receiver, supplier) {
    var key, value;

    for (key in supplier) {
      if (supplier.hasOwnProperty(key)) {
        value = supplier[key];

        // 只 clone 数组和 plain object，其他的保持不变
        if (isArray(value)) {
          value = value.slice();
        }
        else if (isPlainObject(value)) {
          var prev = receiver[key];
          isPlainObject(prev) || (prev = {});

          value = merge(prev, value);
        }

        receiver[key] = value;
      }
    }

    return receiver;
  }

  var keys = Object.keys;

  if (!keys) {
    keys = function(o) {
      var result = [];

      for (var name in o) {
        if (o.hasOwnProperty(name)) {
          result.push(name);
        }
      }
      return result;
    }
  }

  function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  }


  function getInheritedAttrs(instance, specialProps) {
    var inherited = [];
    var proto = instance.constructor.prototype;

    while (proto) {
      // 不要拿到 prototype 上的
      if (!proto.hasOwnProperty('attrs')) {
        proto.attrs = {};
      }

      // 将 proto 上的特殊 properties 放到 proto.attrs 上，以便合并
      copySpecialProps(specialProps, proto.attrs, proto);

      // 为空时不添加
      if (!isEmptyObject(proto.attrs)) {
        inherited.unshift(proto.attrs);
      }

      // 向上回溯一级
      proto = proto.constructor.superclass;
    }

    // Merge and clone default values to instance.
    var result = {};
    for (var i = 0, len = inherited.length; i < len; i++) {
      result = merge(result, normalize(inherited[i]));
    }

    return result;
  }

  function copySpecialProps(specialProps, receiver, supplier, isAttr2Prop) {
    for (var i = 0, len = specialProps.length; i < len; i++) {
      var key = specialProps[i];

      if (supplier.hasOwnProperty(key)) {
        receiver[key] = isAttr2Prop ? receiver.get(key) : supplier[key];
      }
    }
  }


  var EVENT_PATTERN = /^(on|before|after)([A-Z].*)$/;
  var EVENT_NAME_PATTERN = /^(Change)?([A-Z])(.*)/;

  function parseEventsFromInstance(host, attrs) {
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        var m = '_onChange' + ucfirst(attr);
        if (host[m]) {
          host.on('change:' + attr, host[m]);
        }
      }
    }
  }

  function parseEventsFromAttrs(host, attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        var value = attrs[key].value, m;

        if (isFunction(value) && (m = key.match(EVENT_PATTERN))) {
          host[m[1]](getEventName(m[2]), value);
          delete attrs[key];
        }
      }
    }
  }

  // Converts `Show` to `show` and `ChangeTitle` to `change:title`
  function getEventName(name) {
    var m = name.match(EVENT_NAME_PATTERN);
    var ret = m[1] ? 'change:' : '';
    ret += m[2].toLowerCase() + m[3];
    return ret;
  }


  function setSetterAttrs(host, attrs, userValues) {
    var options = { silent: true };
    host.__initializingAttrs = true;

    for (var key in userValues) {
      if (userValues.hasOwnProperty(key)) {
        if (attrs[key].setter) {
          host.set(key, userValues[key].value, options);
        }
      }
    }

    delete host.__initializingAttrs;
  }


  var ATTR_SPECIAL_KEYS = ['value', 'getter', 'setter', 'readOnly'];

  // normalize `attrs` to
  //
  //   {
  //      value: 'xx',
  //      getter: fn,
  //      setter: fn,
  //      readOnly: boolean
  //   }
  //
  function normalize(attrs, isUserValue) {
    // clone it
    attrs = merge({}, attrs);

    for (var key in attrs) {
      var attr = attrs[key];

      if (isPlainObject(attr) &&
          !isUserValue &&
          hasOwnProperties(attr, ATTR_SPECIAL_KEYS)) {
        continue;
      }

      attrs[key] = {
        value: attr
      };
    }

    return attrs;
  }

  function hasOwnProperties(object, properties) {
    for (var i = 0, len = properties.length; i < len; i++) {
      if (object.hasOwnProperty(properties[i])) {
        return true;
      }
    }
    return false;
  }


  // 对于 attrs 的 value 来说，以下值都认为是空值： null, undefined, '', [], {}
  function isEmptyAttrValue(o) {
    return o == null || // null, undefined
        (isString(o) || isArray(o)) && o.length === 0 || // '', []
        isPlainObject(o) && isEmptyObject(o); // {}
  }

  // 判断属性值 a 和 b 是否相等，注意仅适用于属性值的判断，非普适的 === 或 == 判断。
  function isEqual(a, b) {
    if (a === b) return true;

    if (isEmptyAttrValue(a) && isEmptyAttrValue(b)) return true;

    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;

    switch (className) {

      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are
        // equivalent; thus, `"5"` is equivalent to `new String("5")`.
        return a == String(b);

      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `equal`
        // comparison is performed for other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);

      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values.
        // Dates are compared by their millisecond representations.
        // Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;

      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
            a.global == b.global &&
            a.multiline == b.multiline &&
            a.ignoreCase == b.ignoreCase;

      // 简单判断数组包含的 primitive 值是否相等
      case '[object Array]':
        var aString = a.toString();
        var bString = b.toString();

        // 只要包含非 primitive 值，为了稳妥起见，都返回 false
        return aString.indexOf('[object') === -1 &&
            bString.indexOf('[object') === -1 &&
            aString === bString;
    }

    if (typeof a != 'object' || typeof b != 'object') return false;

    // 简单判断两个对象是否相等，只判断第一层
    if (isPlainObject(a) && isPlainObject(b)) {

      // 键值不相等，立刻返回 false
      if (!isEqual(keys(a), keys(b))) {
        return false;
      }

      // 键相同，但有值不等，立刻返回 false
      for (var p in a) {
        if (a[p] !== b[p]) return false;
      }

      return true;
    }

    // 其他情况返回 false, 以避免误判导致 change 事件没发生
    return false;
  }

});

define("arale/base/1.0.1/base-debug", ["./aspect-debug", "./attribute-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug"], function(require, exports, module) {

  // Base
  // ---------
  // Base 是一个基础类，提供 Class、Events、Attrs 和 Aspect 支持。

  var Class = require('arale/class/1.0.0/class-debug');
  var Events = require('arale/events/1.0.0/events-debug');
  var Aspect = require('./aspect-debug');
  var Attribute = require('./attribute-debug');


  module.exports = Class.create({
    Implements: [Events, Aspect, Attribute],

    initialize: function(config) {
      this.initAttrs(config);
    },

    destroy: function() {
      this.off();

      for (var p in this) {
        if (this.hasOwnProperty(p)) {
          delete this[p];
        }
      }
    }
  });

});


define("arale/class/1.0.0/class-debug", [], function(require, exports, module) {

  // Class
  // -----------------
  // Thanks to:
  //  - http://mootools.net/docs/core/Class/Class
  //  - http://ejohn.org/blog/simple-javascript-inheritance/
  //  - https://github.com/ded/klass
  //  - http://documentcloud.github.com/backbone/#Model-extend
  //  - https://github.com/joyent/node/blob/master/lib/util.js
  //  - https://github.com/kissyteam/kissy/blob/master/src/seed/src/kissy.js


  // The base Class implementation.
  function Class(o) {
    // Convert existed function to Class.
    if (!(this instanceof Class) && isFunction(o)) {
      return classify(o)
    }
  }

  module.exports = Class


  // Create a new Class.
  //
  //  var SuperPig = Class.create({
  //    Extends: Animal,
  //    Implements: Flyable,
  //    initialize: function() {
  //      SuperPig.superclass.initialize.apply(this, arguments)
  //    },
  //    Statics: {
  //      COLOR: 'red'
  //    }
  // })
  //
  Class.create = function(parent, properties) {
    if (!isFunction(parent)) {
      properties = parent
      parent = null
    }

    properties || (properties = {})
    parent || (parent = properties.Extends || Class)
    properties.Extends = parent

    // The created class constructor
    function SubClass() {
      // Call the parent constructor.
      parent.apply(this, arguments)

      // Only call initialize in self constructor.
      if (this.constructor === SubClass && this.initialize) {
        this.initialize.apply(this, arguments)
      }
    }

    // Inherit class (static) properties from parent.
    if (parent !== Class) {
      mix(SubClass, parent, parent.StaticsWhiteList)
    }

    // Add instance properties to the subclass.
    implement.call(SubClass, properties)

    // Make subclass extendable.
    return classify(SubClass)
  }


  function implement(properties) {
    var key, value

    for (key in properties) {
      value = properties[key]

      if (Class.Mutators.hasOwnProperty(key)) {
        Class.Mutators[key].call(this, value)
      } else {
        this.prototype[key] = value
      }
    }
  }


  // Create a sub Class based on `Class`.
  Class.extend = function(properties) {
    properties || (properties = {})
    properties.Extends = this

    return Class.create(properties)
  }


  function classify(cls) {
    cls.extend = Class.extend
    cls.implement = implement
    return cls
  }


  // Mutators define special properties.
  Class.Mutators = {

    'Extends': function(parent) {
      var existed = this.prototype
      var proto = createProto(parent.prototype)

      // Keep existed properties.
      mix(proto, existed)

      // Enforce the constructor to be what we expect.
      proto.constructor = this

      // Set the prototype chain to inherit from `parent`.
      this.prototype = proto

      // Set a convenience property in case the parent's prototype is
      // needed later.
      this.superclass = parent.prototype

      // Add module meta information in sea.js environment.
      addMeta(proto)
    },

    'Implements': function(items) {
      isArray(items) || (items = [items])
      var proto = this.prototype, item

      while (item = items.shift()) {
        mix(proto, item.prototype || item)
      }
    },

    'Statics': function(staticProperties) {
      mix(this, staticProperties)
    }
  }


  // Shared empty constructor function to aid in prototype-chain creation.
  function Ctor() {
  }

  // See: http://jsperf.com/object-create-vs-new-ctor
  var createProto = Object.__proto__ ?
      function(proto) {
        return { __proto__: proto }
      } :
      function(proto) {
        Ctor.prototype = proto
        return new Ctor()
      }


  // Helpers
  // ------------

  function mix(r, s, wl) {
    // Copy "all" properties including inherited ones.
    for (var p in s) {
      if (s.hasOwnProperty(p)) {
        if (wl && indexOf(wl, p) === -1) continue

        // 在 iPhone 1 代等设备的 Safari 中，prototype 也会被枚举出来，需排除
        if (p !== 'prototype') {
          r[p] = s[p]
        }
      }
    }
  }


  var toString = Object.prototype.toString
  var isArray = Array.isArray

  if (!isArray) {
    isArray = function(val) {
      return toString.call(val) === '[object Array]'
    }
  }

  var isFunction = function(val) {
    return toString.call(val) === '[object Function]'
  }

  var indexOf = Array.prototype.indexOf ?
      function(arr, item) {
        return arr.indexOf(item)
      } :
      function(arr, item) {
        for (var i = 0, len = arr.length; i < len; i++) {
          if (arr[i] === item) {
            return i
          }
        }
        return -1
      }


  var getCompilingModule = module.constructor._getCompilingModule

  function addMeta(proto) {
    if (!getCompilingModule) return

    var compilingModule = getCompilingModule()
    if (!compilingModule) return

    var filename = compilingModule.uri.split(/[\/\\]/).pop()

    if (Object.defineProperties) {
      Object.defineProperties(proto, {
        __module: { value: compilingModule },
        __filename: { value: filename }
      })
    }
    else {
      proto.__module = compilingModule
      proto.__filename = filename
    }
  }

})


define("arale/events/1.0.0/events-debug", [], function() {

  // Events
  // -----------------
  // Thanks to:
  //  - https://github.com/documentcloud/backbone/blob/master/backbone.js
  //  - https://github.com/joyent/node/blob/master/lib/events.js


  // Regular expression used to split event strings
  var eventSplitter = /\s+/


  // A module that can be mixed in to *any object* in order to provide it
  // with custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = new Events();
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  function Events() {
  }


  // Bind one or more space separated events, `events`, to a `callback`
  // function. Passing `"all"` will bind the callback to all events fired.
  Events.prototype.on = function(events, callback, context) {
    var cache, event, list
    if (!callback) return this

    cache = this.__events || (this.__events = {})
    events = events.split(eventSplitter)

    while (event = events.shift()) {
      list = cache[event] || (cache[event] = [])
      list.push(callback, context)
    }

    return this
  }


  // Remove one or many callbacks. If `context` is null, removes all callbacks
  // with that function. If `callback` is null, removes all callbacks for the
  // event. If `events` is null, removes all bound callbacks for all events.
  Events.prototype.off = function(events, callback, context) {
    var cache, event, list, i

    // No events, or removing *all* events.
    if (!(cache = this.__events)) return this
    if (!(events || callback || context)) {
      delete this.__events
      return this
    }

    events = events ? events.split(eventSplitter) : keys(cache)

    // Loop through the callback list, splicing where appropriate.
    while (event = events.shift()) {
      list = cache[event]
      if (!list) continue

      if (!(callback || context)) {
        delete cache[event]
        continue
      }

      for (i = list.length - 2; i >= 0; i -= 2) {
        if (!(callback && list[i] !== callback ||
            context && list[i + 1] !== context)) {
          list.splice(i, 2)
        }
      }
    }

    return this
  }


  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.prototype.trigger = function(events) {
    var cache, event, all, list, i, len, rest = [], args
    if (!(cache = this.__events)) return this

    events = events.split(eventSplitter)

    // Fill up `rest` with the callback arguments.  Since we're only copying
    // the tail of `arguments`, a loop is much faster than Array#slice.
    for (i = 1, len = arguments.length; i < len; i++) {
      rest[i - 1] = arguments[i]
    }

    // For each event, walk through the list of callbacks twice, first to
    // trigger the event, then to trigger any `"all"` callbacks.
    while (event = events.shift()) {
      // Copy callback lists to prevent modification.
      if (all = cache.all) all = all.slice()
      if (list = cache[event]) list = list.slice()

      // Execute event callbacks.
      if (list) {
        for (i = 0, len = list.length; i < len; i += 2) {
          list[i].apply(list[i + 1] || this, rest)
        }
      }

      // Execute "all" callbacks.
      if (all) {
        args = [event].concat(rest)
        for (i = 0, len = all.length; i < len; i += 2) {
          all[i].apply(all[i + 1] || this, args)
        }
      }
    }

    return this
  }


  // Mix `Events` to object instance or Class function.
  Events.mixTo = function(receiver) {
    receiver = receiver.prototype || receiver
    var proto = Events.prototype

    for (var p in proto) {
      if (proto.hasOwnProperty(p)) {
        receiver[p] = proto[p]
      }
    }
  }


  // Helpers
  // -------

  var keys = Object.keys

  if (!keys) {
    keys = function(o) {
      var result = []

      for (var name in o) {
        if (o.hasOwnProperty(name)) {
          result.push(name)
        }
      }
      return result
    }
  }


  return Events
})


define("test/outputTest/0.0.1/excludeMergeB-debug", [ "./a-debug", "./b-debug", "./c-debug", "gallery/jquery/1.7.2/jquery-debug", "arale/widget/1.0.2/widget-debug", "arale/base/1.0.1/base-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug" ], function(require, exports) {
    var $ = require("gallery/jquery/1.7.2/jquery-debug");
    var widget = require("arale/widget/1.0.2/widget-debug");
    var moduleA = require("./a-debug.js");
    var moduleB = require("./b-debug.js");
    var modulec = require("./c-debug.js");
    exports.get = function(id) {
        var dom = $(id);
        widget.render(dom, module);
    };
});