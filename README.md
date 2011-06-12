A Package Manager for SeaJS
===========================

Install on Mac OS X / Linux
---------------------------

 1. install nodejs from http://nodejs.org/
 2. add /path/to/spm/bin to your system $PATH

Install on Windows
-------------------

### Cygwin

 1. install nodejs(cygwin) from https://github.com/joyent/node/wiki/Building-node.js-on-Cygwin-(Windows)
 2. add /path/to/spm/bin to your cygwin system %PATH%

### Self-Contained Binaries

 1. use this self-contained binaries nodejs on windows http://node-js.prcn.co.cc/
 2. add X:\path\to\spm\bin to your system variables %PATH%

sbuild
------

compile seajs modules with dependencies.

use this to get start:

    sbuild --help

snode
-----

run seajs modules on nodejs.

use this to get start:

    snode --help

spm
---

seajs modules transportment.

use this to get start:

    spm --help

if you want to transport your module(s), use like this:

    spm build jquery

you can use `. /path/to/your/spm/bin/spm-autocomplete.bash` to enable bash autocomplete.
