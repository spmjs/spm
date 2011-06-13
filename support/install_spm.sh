#!/bin/bash
#
# @file install_spm.sh
# @fileoverview: install spm by npm
# @author: Frank Xu(yyfrankyy@gmail.com)
# @usage: ./install_spm.sh 
# @version: 1.0
# @create: 06/13/2011 03:34:15 PM CST

echo "Install spm from local.."
if [[ -z $(git st | grep "^#\s*modified" | grep -v "untracked content") ]]; then
    git archive --format=tar --prefix=spm/ HEAD | gzip >/tmp/spm.tgz
    sudo npm uninstall spm -g && sudo npm install /tmp/spm.tgz -g
    . bin/spm-autocompletion.bash
    echo "DONE!"
else
    echo "FAIL! You need to submit your change first."
fi
