#!/bin/bash

_spm() {
    local action cur opts
    COMPREPLY=()

    action="${COMP_WORDS[1]}"
    cur="${COMP_WORDS[COMP_CWORD]}"
    opts=`spm completion ${action} ${cur}`
    
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    return 0
}

complete -F _spm spm

# ref: http://www.debian-administration.org/articles/317
