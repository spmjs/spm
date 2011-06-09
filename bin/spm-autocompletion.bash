#!/bin/bash
#
# @file spm-autocompletion.sh
# @fileoverview: spm autocomplete
# @author: yyfrankyy(yyfrankyy@gmail.com)
# @usage: ./spm-autocompletion.sh 
# @version: 1.0
# @create: 06/08/2011 08:17:16 PM CST

_spm() {
    local spm cur action modules actions opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    spm="${COMP_WORDS[0]}"
    action="${COMP_WORDS[1]}"
    actions="build transport help --help rm remove"

    modules=`ls modules`
    case "${action}" in
        "build" | "transport")
            if [[ ${cur} == -* ]]; then
                opts="-f --force"
                COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            else
                COMPREPLY=( $(compgen -W "${modules}" -- ${cur}) )
            fi
            return 0;
            ;;

        "rm" | "remove")
            if [[ ${cur} == -* ]]; then
                opts="-f --force -v --version"
                COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            else
                COMPREPLY=( $(compgen -W "${modules}" -- ${cur}) )
            fi
            return 0;
            ;;
    esac

    if [[ "${spm}" == "spm" ]]; then
        COMPREPLY=( $(compgen -W "${actions}" -- ${cur}) )
        return 0;
    fi
}

complete -F _spm spm
