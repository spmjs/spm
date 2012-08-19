
var ProtoList = require('proto-list');
var path = require('path');
var fs = require('fs');
var fsExt = require('./fs_ext.js');
var env = require('./env.js');
var EE = require('events').EventEmitter;
var url = require('url');
var http = require('http');

var exports = module.exports = function () {
  var args = [].slice.call(arguments);
  var conf = new ConfigChain();

  while(args.length) {
    var a = args.shift();
    if(a) {
      conf.push('string' === typeof a ? json(a) : a);
    }
  }

  return conf
}

//recursively find a file...

var find = exports.find = function () {
  var rel = path.join.apply(null, [].slice.call(arguments))

  function find(start, rel) {
    var file = path.join(start, rel)
    try {
      fs.statSync(file)
      return file
    } catch (err) {
      if(start != '/')
        return find(path.dirname(start), rel)
    }
  }
  return find(__dirname, rel)
}

var parse = exports.parse = function (content, type) {
  content = '' + content

  // if we don't know what it is, try json and fall back to eval
  // if we know what it is, then it must be that.
  try { 
    return JSON.parse(content) 
  } catch (er) {
    return eval('(' + content + ')') 
  }
};

var json = exports.json = function () {
  var file = path.join.apply(null, [].slice.call(arguments))
  var content
  try {
    content = fsExt.readFileSync(file);
  } catch (err) {
    return
  }
  return parse(content, 'json');
};


exports.ConfigChain = ConfigChain;

function ConfigChain () {
  EE.apply(this)
  ProtoList.apply(this, arguments)
  this._awaiting = 0
  this._saving = 0
  this.sources = {}
}

// multi-inheritance-ish
var extras = {
  constructor: { value: ConfigChain }
};

Object.keys(EE.prototype).forEach(function (k) {
  extras[k] = Object.getOwnPropertyDescriptor(EE.prototype, k);
});

ConfigChain.prototype = Object.create(ProtoList.prototype, extras)

ConfigChain.prototype.set = function (key, value) {
  var target = this.list[0]
  if (!target) {
    return this.emit('error', new Error('cannot set, no confs!'))
  }
  target[key] = value
  return this
};

ConfigChain.prototype.get = function (key) {
  return this.list[0][key]
};

ConfigChain.prototype.addFile = function (file, type) {
  if (!fsExt.existsSync(file)) {
    console.warn('not found file ' + file);
    return this;
  }
  var data = fsExt.radFileSync(file);
  this.addString(data);
  return this;
}

ConfigChain.prototype.addUrl = function (req, type, name) {
  this._await()
  var href = url.format(req)
  name = name || href
  var marker = {__source__:name}
  this.sources[name] = { href: href, type: type }
  this.push(marker)
  http.request(req, function (res) {
    var c = []
    var ct = res.headers['content-type']
    if (!type) {
      type = ct.indexOf('json') !== -1 ? 'json'
           : ct.indexOf('ini') !== -1 ? 'ini'
           : href.match(/\.json$/) ? 'json'
           : href.match(/\.ini$/) ? 'ini'
           : null
      marker.type = type
    }

    res.on('data', c.push.bind(c))
    .on('end', function () {
      this.addString(Buffer.concat(c), href, type, marker)
    }.bind(this))
    .on('error', this.emit.bind(this, 'error'))

  }.bind(this))
  .on('error', this.emit.bind(this, 'error'))
  .end()

  return this
}

ConfigChain.prototype.addString = function (data, type) {
  data = this.parse(data, type)
  this.add(data, marker)
  return this
}

ConfigChain.prototype.add = function (data, marker) {
  if (marker && typeof marker === 'object') {
    var i = this.list.indexOf(marker)
    if (i === -1) {
      return this.emit('error', new Error('bad marker'))
    }
    this.splice(i, 1, data)
    marker = marker.__source__
    this.sources[marker] = this.sources[marker] || {}
    this.sources[marker].data = data
    // we were waiting for this.  maybe emit 'load'
    this._resolve()
  } else {
    if (typeof marker === 'string') {
      this.sources[marker] = this.sources[marker] || {}
      this.sources[marker].data = data
    }
    // trigger the load event if nothing was already going to do so.
    this._await()
    this.push(data)
    process.nextTick(this._resolve.bind(this))
  }
  return this
}

ConfigChain.prototype.parse = exports.parse

ConfigChain.prototype._await = function () {
  this._awaiting++
}

ConfigChain.prototype._resolve = function () {
  this._awaiting--
  if (this._awaiting === 0) this.emit('load', this)
}
