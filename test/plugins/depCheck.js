var should = require('should');
var path = require('path');
var ProjectFactory = require('../../lib/core/project_factory.js');
var fsExt = require('../../lib/utils/fs_ext.js');
var Opts = require('../../lib/utils/commander.js');
require('../module.js');

describe('depCheck plugin test', function() {
  var action = "build";
  var opts = Opts.get(action);
 
  var plugin = require('../../lib/plugins/depCheck.js');

  afterEach(function() {
    plugin._reservedDeps = [];
    plugin._modDepMapping = {};
  });

  it('get conflict mod widget/1.0.0 and widget/1.0.2', function() {
    var modDepMapping = {
      'modA': [ './switchable','arale/widget/1.0.2/widget', 'arale/widget/1.0.0/widget' ],
      'modB': [ './switchable','arale/widget/1.0.2/widget', 'arale/events/1.0.0/events', 'arale/widget/1.0.0/widget' ]
    };
    var reservedDeps = ['$'];

    var conflictMod = [];
    plugin._reservedDeps = reservedDeps;
    plugin._modDepMapping = modDepMapping;

    var conflictMod = plugin._getConflictMod('modA', conflictMod);
    conflictMod.should.eql([ 'arale/widget/1.0.0,arale/widget/1.0.2']);
  });

  it('get conflict mod []', function() {
    var modDepMapping = {
      'modA': ['gallery/jquery.a/1.0.2/jquery.plugin', 'gallery/jquery/1.8.3/jquery' ],
      'modB': ['gallery/jquery.plugin/1.0.2/jquery.plugin', 'gallery/jquery/1.8.3/jquery' ],
    };

    var reservedDeps = ['$'];
    var conflictMod = [];

    plugin._reservedDeps = reservedDeps;
    plugin._modDepMapping = modDepMapping;

    var conflictMod = plugin._getConflictMod('modA', conflictMod);
    conflictMod.should.eql([]);
  });

  it('get conflict mod jquery.plugin and jquery', function() {
    var modDepMapping = {
      'modA': ['gallery/jquery/1.0.2/jquery.plugin', 'gallery/jquery/1.8.3/jquery' ],
      'modB': ['gallery/jquery.plugin/1.0.3/jquery.plugin', 'gallery/jquery/1.8.4/jquery' ],
    };

    var reservedDeps = ['$'];
    var conflictMod = [];

    plugin._reservedDeps = reservedDeps;
    plugin._modDepMapping = modDepMapping;

    var conflictMod = plugin._getConflictMod('modA', conflictMod);
    conflictMod.should.eql(['gallery/jquery/1.8.3,gallery/jquery/1.0.2']);
  });
});
