Developping spm
===============

Installations
-------------

Since we haven't submit to npm yet, so we have to use these command to 
install `spm` by npm manually, run:

    support/install_spm.sh

Type this for starting `spm`:

    spm help

You can use `. /path/to/your/spm/bin/spm-autocomplete.bash` to enable 
bash autocompletion, or just put it into your `.bashrc`/`.profile`.

Actions
-------

spm now support for these actions:

### spm build [options] [module]

Provide transporting code to seajs compatible modules.

It read `.tspt` file from `transports` directory then parsing into `modules` 
direcotry. then update `data.js` for webpage.

If you do not specific any modules, it will build all modules by default.

It also provide two options:

#### --force or -f

force update modules. `false` by default.

#### --gzip or -g

use `node-compress` for calculating gzipped modules size. `false` by default.

### spm remove [options] [module]

Remove modules from `modules` directory, then update `data.js`.

It provide these options:

#### --force or -f

force remove modules, ignore any error. `false` by default.

### spm test [module]

Automatically test for all spm specs in `test/spm` directory.
