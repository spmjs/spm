A Package Manager for SeaJS
===


Installation
---

1. Install nodejs and npm: [How to install node.js and npm](http://joyeur.com/2010/12/10/installing-node-and-npm/)
1. Install spm:

    $ npm install -g https://github.com/seajs/spm/tarball/master



Usage
---

### spm install [options] name[@version]

Get all compatible modules in the sea:

    $ mkdir libs
    $ cd libs
    $ spm install *

Only get a specific module:

    $ spm install jquery@1.6.2

For more details:

    $ spm help install


### spm build [options] module

Compress a module file:

    $ spm build a.js

Compress and combine to one file with dependencies:

    $ spm build a.js --combine

Compress and combine to one file with all dependencies:

    $ spm build a.js --combine_all

Remove built files:

    $ spm build --clear

You can define `build-config.js` to specify more information:

build-config.js:

````
module.exports = {
  "libs_path": "/path/to/libs/",
  "loader_config": ".path/to/init.js"
};

````

For all options, please call:

    $ spm help build




For Ninja Users
---

### Auto completion

Add this line:

    . ~/local/lib/node_modules/spm/bin/spm-autocomplete.bash

to your `.bash_profile` can enable auto completion for spm.


### spm transport [--force] transport.js

You can use `transport` to wrap custom modules:

    $ cd path/to/modules
    $ mkdir xxx
    $ cp jquery/transport.js xxx/
    $ vi xxx/transport.js  # modify it
    $ spm transport xxx/transport.js


### Use spm from JavaScript

To use spm from JavaScript, you'd do the following:

    var spm = require('spm');

    var build = new spm.Build(['a.js', 'b.js'], {
      combine: true
    });
    build.run();
