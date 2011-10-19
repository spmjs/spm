A Package Manager for SeaJS
===


Installation
---

1. Install nodejs and npm ([How to install node.js and npm](http://joyeur.com/2010/12/10/installing-node-and-npm/))
1. Then call:

    sudo npm install spm -g


Usage
---

### spm install [options] name[@version]

To get all compatible modules in the sea:

    mkdir libs
    cd libs
    spm install *

Only want to get some specify modules:

    spm install jquery@1.6.2

For more details:

    spm help install


### spm build [options] module

