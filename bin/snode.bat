@echo off

"%~d0%~p0..\node-win32\node.exe" --stack_size=8192 "%~d0%~p0\..\lib\snode.js" %*
