@echo off
SET "PATH=%PATH%;C:\Program Files\nodejs"
echo Running Gulp Build...
call npm run build
pause
