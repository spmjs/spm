#!/bin/bash
#usage: . install.sh

touch ~/.bash_profile
if [ `grep -c "#add ~/local/bin to PATH" ~/.bash_profile` == 0 ]; then
  echo Set PATH...
  echo 'export PATH=$HOME/local/bin:$PATH #add ~/local/bin to PATH' >> ~/.bash_profile
  . ~/.bash_profile
fi

if [ -z "`which node`" -o -z "`node --version | grep v0.6`" ]; then
  echo Install node...
  mkdir ~/tmp
  rm -rf ~/tmp/node-install
  mkdir ~/tmp/node-install
  cd ~/tmp/node-install
  curl http://nodejs.org/dist/v0.6.0/node-v0.6.0.tar.gz | tar xz --strip-components=1
  mkdir ~/local
  ./configure --prefix=~/local
  sudo make
  sudo make install # ok, fine, this step probably takes more than 30 seconds...
fi

if [ -z "`which npm`" -o -z "`npm --version | grep 1.0`" ]; then
  echo Install npm...
  curl http://npmjs.org/install.sh | sudo sh
fi

echo Install spm...
sudo npm install -g https://github.com/seajs/spm/tarball/master