@echo off
REM Avvia il server in una nuova finestra
start "Server" cmd /k "cd /d C:\Users\u02\Desktop\NutrizionistaFinal\ && node server.js"

REM Attendi 3 secondi
timeout /t 3 /nobreak >nul

REM Avvia la seconda finestra per chiudere i processi sulla porta 3000 e poi eseguire npm start
start "Client" cmd /k "echo Chiudo eventuali processi sulla porta 3000... & for /f ^"tokens=5^" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a & timeout /t 3 /nobreak >nul & npm start"
