@echo off
echo Chiudo eventuali processi sulla porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a
timeout /t 2
npm start
