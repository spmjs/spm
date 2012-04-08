A Package Manager for SeaJS
===



Installation
---

First, install node and npm: http://nodejs.org/#download

Then

    $ npm install spm -g



Usage
---

### spm install [options] name[@version]

Get all compatible modules in the sea:

    $ mkdir libs
    $ cd libs
    $ spm install all

Only get a specific module:

    $ spm install jquery@1.7.2

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

    module.exports = {
      "base_path": "/path/to/libs/",
      "app_url": "http://test.com/js/app/",
      "app_path": "/path/to/app/",
      "loader_config": "path/to/init.js"
    };

For all options, please call:

    $ spm help build



For Advanced Users
---

### Auto completion

Add this line:

    . /usr/local/lib/node_modules/spm/bin/spm-autocompletion.bash

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
