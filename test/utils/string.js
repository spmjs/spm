var string = require('../../lib/utils/string.js');
var _ = require('underscore');
var _s = require('underscore.string');
_.mixin(_s.exports());

//console.info(111, _.camelize('a-bc'));
//console.info(_('a-bc').chain().camelize().capitalize().value())

describe('string util ', function() { 
  it('test camel method', function() {
    var s1 = 'a-b';
    var s2 = 'extra-resources';
    var s3 = 'debug';
    var s4 = '-debug';
    var s5 = 'debug-';
    var s6 = 'a_b';

    string.camelStr(s1).should.eql('aB');
    string.camelStr(s2).should.eql('extraResources');
    string.camelStr(s3).should.eql(s3);
    string.camelStr(s4).should.eql(s4);
    string.camelStr(s5).should.eql(s5);
    string.camelStr(s6).should.eql(s6);
  });

  it('test endWith method', function() {
    var s1 = 'abc';
    var s2 = 'defg';
    var s3 = 'a/b/c';
    var s4 = 'abc.js#';
    var s5 = 'abc.js';

    string.endWith(s1, 'c').should.be.true;
    string.endWith(s2, 'defg').should.be.true;
    string.endWith(s3, 'c').should.be.true;
    string.endWith(s4, 'js#').should.be.true;
    string.endWith(s5, 'js').should.be.true;

    string.endWith(s1, 'ab').should.be.false;
    string.endWith(s4, 'js').should.be.false;
  });

  it('test splitCamel method', function() {
    var s1 = 'ab';
    var s2 = 'Ab';
    var s3 = 'aB';
    var s4 = 'Abcd';
    var s5 = 'abCD';
    var s6 = 'srcName';
    var s7 = 'src-Name';

    string.splitCamelStr(s1).should.eql(s1);
    string.splitCamelStr(s2).should.eql(s2);
    string.splitCamelStr(s3).should.eql('a-b');
    string.splitCamelStr(s4).should.eql(s4);
    string.splitCamelStr(s5).should.eql('ab-cD');
    string.splitCamelStr(s6).should.eql('src-name');
    string.splitCamelStr(s7).should.eql(s7);
  });

  it('test bigCamelStr method', function() {
    var s1 = 'abc-def';
    var s2 = 'a';
    var s3 = 'ab';
    var s4 = 'a-b';

    string.bigCamelStr(s1).should.eql('AbcDef');
    string.bigCamelStr(s2).should.eql(s2);
    string.bigCamelStr(s3).should.eql(s3);
    string.bigCamelStr(s4).should.eql('AB');
  });
});
