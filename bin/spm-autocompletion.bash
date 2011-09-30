#!/bin/bash

_spm() {
    local prev cur opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    opts=`spm completion ${prev} ${cur}`
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    return 0
}

complete -F _spm spm

# ref: http://www.debian-administration.org/articles/317
