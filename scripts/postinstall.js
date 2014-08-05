#!/usr/bin/env node

var spmrc = require('spmrc');

var registry = spmrc.get('source.default.url');
var auth = spmrc.get('source.default.auth');

if (!spmrc.get('registry') && registry && registry !== 'http://spmjs.io') {
  spmrc.set('registry', registry);
}
if (!spmrc.get('auth') && auth) {
  spmrc.set('auth', auth);
}
