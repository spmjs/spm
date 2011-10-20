#!/bin/bash
#usage: . install.sh

touch ~/.bash_profile
if [ `grep -c "#add ~/local/bin to PATH" ~/.bash_profile` == 0 ]
  then
    echo 'export PATH=$HOME/local/bin:$PATH #add ~/local/bin to PATH' >> ~/.bash_profile
    . ~/.bash_profile
fi

if [ -z `which node` ]
  then
    mkdir ~/tmp
    rm -rf ~/tmp/node-install
    mkdir ~/tmp/node-install
    cd ~/tmp/node-install
    curl http://nodejs.org/dist/v0.5.9/node-v0.5.9.tar.gz | tar xz --strip-components=1
    mkdir ~/local
    ./configure --prefix=~/local
    sudo make
    sudo make install # ok, fine, this step probably takes more than 30 seconds...
fi

if [ -z `which npm` ]
  then
    curl http://npmjs.org/install.sh | sudo sh
fi

echo Installing spm...
sudo npm install -g https://github.com/seajs/spm/tarball/master