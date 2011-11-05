A Package Manager for SeaJS
===


Installation
---

### Unix/Macintosh:

    $ curl https://raw.github.com/seajs/spm/master/install.sh | sudo sh


### Windows:

1. Download https://github.com/seajs/spm/zipball/master , and unzip it to `C:\spm`
2. Download http://nodejs.org/dist/v0.6.0/node.exe to `C:\spm\bin\node.exe`
3. Then, add `C:\spm\bin` to your system PATH.
4. Finally, run cmd.exe, and type `spm` to do your work!


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


### Using npm Programmatically

To use spm from JavaScript, you'd do the following:

    var spm = require('spm');

    var build = new spm.Build(['a.js', 'b.js'], {
      combine: true
    });
    build.run();
