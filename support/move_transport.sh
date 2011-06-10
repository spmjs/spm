#!/bin/bash
#
# @file move.sh
# @fileoverview: 
# @author: 鏂囨渤(wenhe@taobao.com)
# @usage: ./move.sh 
# @version: 1.0
# @create: 06/10/2011 12:48:47 PM CST

for i in `ls modules`
do
    mv modules/${i}/transport.js transports/${i}.tspt
done
