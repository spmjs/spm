#!/usr/bin/env node

if (process.env.SUDO_USER) {
  console.log('');
  console.log('NO SUDO PLEASE!!!')
  console.log('Maybe you need run:');
  console.log('');
  console.log('$ sudo chown -R $USER /usr/local');
  console.log('');
  console.log('More information on http://howtonode.org/introduction-to-npm');
  // don't install spm now
  process.exit(1);
}

try {
  require('spm').plugin.uninstall('zip');
  require('spm').plugin.uninstall('doctor');
  require('spm').plugin.uninstall('test');
  require('spm').plugin.uninstall('totoro');
  require('spm').plugin.uninstall('watch');
  require('spm').plugin.uninstall('cdn');
  require('spm').plugin.uninstall('doc');
  require('spm').plugin.uninstall('init');
} catch(e) {}
