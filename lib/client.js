var co = require('co');
var spmrc = require('spmrc');
var client = require('spm-client');
var readJSON = require('fs-extra').readJSONSync;
var exists = require('fs').existsSync;

// read registry from spm.registry in package.json
var registry;
if (exists('package.json')) {
  var pkg = readJSON('package.json');
  var spm = pkg.spm || {};
  registry = spm.registry;
}

// load global config from spmrc
client.config({
  registry: registry || spmrc.get('registry'),
  proxy: spmrc.get('proxy'),
  auth: spmrc.get('auth'),
  temp: spmrc.get('user.temp')
});

exports.config = client.config;

var methods= [
  'publish',
  'unpublish',
  'login',
  'install',
  'info',
  'search'
];

// export client api with co wrap
methods.forEach(function(method) {
  exports[method] = co(client[method]);
});


