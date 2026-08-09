@echo off
cd /d "%~dp0"
REM Keep this file ASCII-only with CRLF endings.
REM cmd.exe parses .cmd in the console OEM codepage before any line can change it,
REM so UTF-8 bytes are misread and can split a line into a bogus command. Measured
REM on Korean Windows (CP949): two "not recognized as a command" errors printed
REM before the launcher ran. Comments in this file therefore stay in English.
REM No -NoExit: it left an empty window behind forever after the server stopped.
REM start.ps1 holds the window open with Read-Host when startup fails, so the
REM error stays readable instead of vanishing with the window.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start.ps1"
