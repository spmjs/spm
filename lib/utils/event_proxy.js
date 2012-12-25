var _ = require('underscore');

var EventProxy = module.exports = function() {
   if (!(this instanceof EventProxy)) {
      return new EventProxy();
    }
    this._callbacks = [];
    this._fired = {};
};

EventProxy.create = function() {
 
  var ep = new EventProxy();
  var argsLength = arguments.length;
  var events = [].slice.apply(arguments, [0, argsLength - 1]);
  var callback = arguments[argsLength - 1];
  ep.on(callback);

  var fired = ep._fired;
  events.forEach(function(en) {
    fired[en] = undefined; 
  });
  return ep;
};

EventProxy.prototype.add = function(en) {
  var fired = this._fired;
  if (!(en in fired)) {
    fired[en] = undefined;
  } else {
    console.warn('不允许设置重复事件');
  }
};

EventProxy.prototype.emit = function(en, data) {
  var fired = this._fired;
  if (!(en in fired)) {
    console.warn('发布了一个不存在的事件!');
  } else {
    fired[en] = data || null;
    this.over();
  }
};

EventProxy.prototype.isOver = function() {
  var fired = this._fired;
  return _.keys(fired).every(function(en) {
    return !_.isUndefined(fired[en]);
  });
};

EventProxy.prototype.over = function() {
  if (!this.isOver()) {
    return;
  }
  var callback;
  while(callback = this._callbacks.pop()) {
    callback(this._fired); 
  }
}

EventProxy.prototype.on = function(fn) {
  if (_.isFunction(fn)) {
    this._callbacks.push(fn);
  }
};
