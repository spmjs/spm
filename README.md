A Package Manager for SeaJS
===


Installation
---

1. Install nodejs and npm ([How to install node.js and npm](http://joyeur.com/2010/12/10/installing-node-and-npm/))
1. Then install spm:

    npm install -g https://github.com/seajs/spm/tarball/master



Usage
---

### spm install [options] name[@version]

To get all compatible modules in the sea:

    mkdir libs
    cd libs
    spm install *

Only get a specific module:

    spm install jquery@1.6.2

For more details:

    spm help install


### spm build [options] module



For Ninja Users
---

### auto completion

Add this line:

    . ~/local/lib/node_modules/spm/bin/spm-autocomplete.bash

to your `.bash_profile` can enable auto completion for spm.


