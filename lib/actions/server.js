var http = require('http');
var fs = require('fs');
var util = require('util');
var url = require('url');
var path = require('path');
var async = require('async');
var mime = require('mime');
var tar = require('tar');
var fstream = require('fstream');
var zlib = require('zlib');
var querystring = require('querystring');

var ActionFactory = require('./action_factory.js');
var fsExt = require('../utils/fs_ext.js');

// 工具类加载

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('./build/core/project_factory.js');

var fileDir = process.cwd();

var argv = require('optimist')
    .usage('Usage: $0 -p[server port] -d[relative dir]') 
    .default('p', '8000')
    .argv;

var pathMapping = {
    
};

var Server = ActionFactory.create('Server');

var tempDir = path.join(fileDir, '_temp');
fsExt.mkdirS(tempDir);

console.log('port---->', argv.p);
Server.prototype.run = function(callback) {
  var instance = this;
  var options = this.options;
  var context = argv.d || '.';

  // 根据当前执行目录，查找配置文件，构建项目信息。
  http.createServer( function(req, res) {
console.log('req.url---->', req.url, req.method)
    var queryUrl = req.url
    queryUrl = path.join(context, req.url);  

    if (isfavicon(queryUrl, res)) {
      return;
    }
    

    if (req.method === 'GET') {
      renderPath(queryUrl, res);
    } else if (req.method === 'PUT') {
      addModule(queryUrl, req, res);
    } else if (req.method === 'HEAD') {
      checkModule(queryUrl, res);
    }

  }).listen(argv.p);
};

function isfavicon(queryUrl, res) {
  if (queryUrl.indexOf('favicon.ico') > -1) {
    res.write('<html><title>title</title><head></head><body></html>');	
    return true;
  }
  return false;
}

function addModule(queryUrl, req, res) {
  var temp = path.join(tempDir, 't' + parseInt(Math.random() * 10000000));
  fsExt.mkdirS(temp);
  req.pipe(zlib.Unzip())
    .pipe(tar.Extract({path: temp})).
    on('error', function() {
      console.log('error----');
    }).
    on('close', function() {
      // 读取tar包信息
      // 在把tar包打包到相应的位置
      var files = fs.readdirSync(temp);
      var moduleDir = path.join(temp, files[0]);
      var modulePath = getModulePath(moduleDir);

      if (!modulePath) {
        console.error('module read error !');
        res.end();
      } else {
        copyModule(moduleDir, modulePath, files[0], function() {
          res.end();
        }); 
      }
    });
}

// 读取配置信息
function getModulePath(moduleTarPath) {
  var configPath = path.join(moduleTarPath, 'package.json'); 
  if (!fsExt.existsSync(configPath)) {
    return null;
  }

  var config = eval('(' + fs.readFileSync(configPath) + ')');
  var modulePath = config.root == '#' ? '' : config.root;  
  return path.join(fileDir, modulePath, config.name, config.version);
}

// 把tar包copy到对应的位置
function copyModule(moduleDir, modulePath, moduleName, callback) {
console.log('copy module ', moduleDir, modulePath);

  if (!fsExt.existsSync(modulePath)) {
    fsExt.mkdirS(modulePath)
  }
  var moduleTarPath = path.join(modulePath, moduleName + '.tgz');

  fsExt.copydirSync(moduleDir, modulePath);

  fstream.Reader({path: moduleDir, type: "Directory"})
    .pipe(tar.Pack())
    .pipe(zlib.createGzip())
    .pipe(fstream.Writer(moduleTarPath)).on('close', function() {
      callback();
    }).on('error', function(err) {
console.log('error------------>', err);
    });
}

function checkModule(queryUrl, res) {
  var realPath = path.join(fileDir, queryUrl);
  var statusCode = 200;
  if (!fsExt.existsSync(realPath)) {
    statusCode = 404;
  }
  res.writeHeader(statusCode, {'Content-Type': 'text/html;charset=UTF-8'});
  res.end();
}


var renderPath = function(queryUrl, res) {
    Type.getTypeObj(queryUrl).output(res);
};

var Type = function(queryUrl) {
	this.contentType = 'text/html';
	this.data = [];
	this.queryUrl = queryUrl; 
};

Type.prototype = {
	outputHeader: function(res) {
	  var statusCode = 200;
      if (!fsExt.existsSync(this.realPath)) {
        statusCode = 404;
      }
	  res.writeHeader(statusCode, {'Content-Type': this.contentType +  ';charset=UTF-8'});
	},
	outputHtmlHead: function(res) {
		res.write('<html><title>title</title><head></head><body>');	
	},
	outputHtmlBody: function(res) {
	    var data = this.getData();
	    if (!data) {
		  res.writeHeader(404, {'Content-Type': this.contentType +  ';charset=UTF-8'});
		  data = 'not found module ' + this.queryUrl;
        }
		res.write('' + data); 
	},
	outputHtmlEnd: function(res) {
		res.end('</body></html>');
	},
	output: function(res) {
		this.outputHeader(res);
		this.outputHtmlHead(res);
		this.outputHtmlBody(res);
		this.outputHtmlEnd(res);
	},
	getData: function() {
		throw new Error('This Is A Abstract Class');	
	},
    getContentType: function() {
        var ext = path.extname(this.queryUrl);
        if (ext === '.tgz') {
          return "application/octet-stream";
        }
        return mime.lookup(path.basename(this.queryUrl));                
    }
};
var getType = function(path) {
	var index = path.lastIndexOf('.');
	if (index < 0) {
		return "dir";
	}	
	return path.substring(index + 1, path.length);
};

var verReg = /\.\d+(-dev)?/;
Type.getTypeObj = function(queryUrl) {
  var ext = path.extname(queryUrl);
  if (!ext || verReg.test(ext)) {
    return new DirType(queryUrl);
  }
  return new FileType(queryUrl);
};

var DirType = function() {
  Type.apply(this, arguments);
  this.realPath = path.join(fileDir, this.queryUrl);
};

util.inherits(DirType, Type);

DirType.prototype.getData = function() {
  var that = this;
  var data = [];
  var realPath = path.join(fileDir, this.queryUrl);
  if (!fsExt.existsSync(this.realPath)) {
    return null;
  }
  try {
    fs.readdirSync(realPath).forEach(function(name) {
      data.push(that.getLink(name));
    });
    return data.join('<br/>');
  } catch (e) {
    return null;
  }
};

DirType.prototype.getLink = function(title) {
  var newUrl = '/' + path.join(this.queryUrl, title);
console.log('getLink--->', this.queryUrl)
console.log('tilte--->', title)


  return '<a href="' + newUrl + '">' + title + '</a>';
};

var FileType = function() {
  Type.apply(this, arguments);
  this.contentType = this.getContentType(this.pathname);
};

util.inherits(FileType, Type);

FileType.prototype.output = function(res) {
  this.outputHeader(res);
  var n = 1024 * 1024;
  var buffer = new Buffer(n);
  var filepath = path.join(fileDir, this.queryUrl);
console.log('exists---->', fsExt.existsSync(filepath), filepath)
  if (!fsExt.existsSync(filepath)) {
    res.writeHeader(404, {'Content-Type': this.getContentType() +  ';charset=UTF-8'});
	var data = 'not found module ' + this.queryUrl;
	res.write('' + data); 
	res.end();
  } else {
console.log('---------------read', filepath)
    res.writeHeader(200, {'Content-Type': this.getContentType() +  ';charset=UTF-8'});
    var rs = fs.createReadStream(filepath);
    rs.on('open', function(fd) {
      readLargeFile(n, fd, buffer, 0, res); 
    });
  }
};

var readLargeFile = function(n, fd, buffer, i, res) {
  fs.read(fd, buffer, 0, n, n*i, function(err, bytesRead, b) {
    i++;
    if (bytesRead == n) {
      res.write(buffer);
      readLargeFile(n, fd, buffer, i, res);
    } else {
      res.end(buffer.slice(0, bytesRead)); 
    }
  }); 
};

module.exports = Server;
