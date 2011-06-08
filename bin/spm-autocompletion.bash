#!/bin/bash
#
# @file spm-autocompletion.sh
# @fileoverview: spm autocomplete
# @author: yyfrankyy(yyfrankyy@gmail.com)
# @usage: ./spm-autocompletion.sh 
# @version: 1.0
# @create: 06/08/2011 08:17:16 PM CST

_spm() {
    local spm cur action modules actions
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    spm="${COMP_WORDS[0]}"
    action="${COMP_WORDS[1]}"
    actions="transport help"

    modules=`ls modules`
    case "${action}" in
        transport)
            COMPREPLY=( $(compgen -W "${modules}" -- ${cur}) )
            return 0
            ;;
    esac

    if [[ "${spm}" == "spm" ]]; then
        COMPREPLY=( $(compgen -W "${actions}" -- ${cur}) )
        return 0;
    fi
}

complete -F _spm spm
