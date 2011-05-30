@echo off

node.exe --stack_size=8192 "%~d0%~p0\..\lib\sbuild\sbuild.js" %*
