#!/bin/bash
#
# @file spm-autocompletion.sh
# @fileoverview: spm autocomplete
# @author: yyfrankyy(yyfrankyy@gmail.com)
# @usage: ./spm-autocompletion.sh 
# @version: 1.0
# @create: 06/08/2011 08:17:16 PM CST

_spm() {
    local spm cur action args actions
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    spm="${COMP_WORDS[0]}"
    len="${#COMP_WORDS[@]}"
    action="${COMP_WORDS[1]}"
    args=`bin/spm completion ${action} ${cur}`
    COMPREPLY=( $(compgen -W "${args}" -- ${cur}) )
    return 0;
}

complete -o default -F _spm spm
