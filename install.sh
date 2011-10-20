#!/bin/bash

touch ~/.bash_profile
if [ `grep -c "#add ~/local/bin to PATH" ~/.bash_profile` == 0 ]
  then
    echo 'export PATH=$HOME/local/bin:$PATH #add ~/local/bin to PATH' >> ~/.bash_profile
    . ~/.bash_profile
fi

if [ -z `which node` ]
  then
    mkdir ~/tmp
    mkdir ~/tmp/node-install
    cd ~/tmp/node-install
    curl http://nodejs.org/dist/node-v0.4.12.tar.gz | tar xz --strip-components=1
    mkdir ~/local
    ./configure --prefix=~/local
    sudo make
    sudo make install # ok, fine, this step probably takes more than 30 seconds...
fi

if [ -z `which npm` ]
  then
    curl http://npmjs.org/install.sh | sudo sh
fi

echo installing spm...
sudo npm install -g https://github.com/seajs/spm/tarball/master