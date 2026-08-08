@echo off
cd /d "%~dp0"
REM -NoExit을 쓰지 않는다. 그것 때문에 서버가 끝난 뒤에도 빈 창이 영영 남았다.
REM 시작 실패는 start.ps1이 Read-Host로 붙잡아 오류를 보여준다.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start.ps1"
