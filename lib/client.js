var co = require('co');
var spmrc = require('spmrc');
var client = require('spm-client');

// load global config from spmrc
client.config({
  registry: spmrc.get('registry'),
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
