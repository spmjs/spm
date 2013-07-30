#!/usr/bin/env node

if (process.getuid && process.getuid() === 0) {
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
