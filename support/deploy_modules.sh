#!/bin/bash
#
# @file deploy_modules.sh
# @fileoverview: deploy modules.seajs.com
# @author: yyfrankyy(yyfrankyy@gmail.com)
# @usage: ./deploy_modules.sh 
# @version: 1.0
# @create: 06/29/2011 11:33:00 AM CST

cd seajs.cloudfoundry.com
vmc update seajs
