#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var spmrc = require('spmrc');
var exeq = require('exeq');

var registry = spmrc.get('source.default.url');
var auth = spmrc.get('source.default.auth');

if (!spmrc.get('registry') && registry && registry !== 'http://spmjs.io') {
  spmrc.set('registry', registry);
}
if (!spmrc.get('auth') && auth) {
  spmrc.set('auth', auth);
}

if (process.platform !== 'win32') {
  console.log('Installing spm completion.');
  exeq([
    ['cp', path.join(__dirname, '.spm_completion'), spmrc.get('user.home')].join(' ')
  ]).on('done', function() {
    var text = '\n. ~/.spm_completion';
    var profile = spmrc.get('user.home') + '/.profile';
    var bashRc = spmrc.get('user.home') + '/.bashrc';
    var bashProfile = spmrc.get('user.home') + '/.bash_profile';
    var zshRc = spmrc.get('user.home') + '/.zshrc';

    if (process.env.SHELL === '/bin/zsh') {
      writeProfile(zshRc, text);
    } else {
      if (fs.existsSync(profile)) {
        writeProfile(profile, text);
      } else if (fs.existsSync(bashRc)) {
        writeProfile(bashRc, text);
      } else if (fs.existsSync(bashProfile)) {
        writeProfile(bashProfile, text);
      }
    }
  });
}

function writeProfile (file, text) {
  if (fs.existsSync(file)) {
    var result = fs.readFileSync(file).toString();
    if (!/spm_completion/.test(result)) {
      fs.writeFileSync(file, result + text);
    }
  } else {
    fs.writeFileSync(file, text);
  }
}
