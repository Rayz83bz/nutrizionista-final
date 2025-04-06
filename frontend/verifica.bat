@echo off
setlocal enabledelayedexpansion

REM Lista dei file da controllare
set files=^
  src\App.jsx ^
  src\index.js ^
  src\components\Navbar.jsx ^
  src\components\Dashboard.jsx ^
  src\pages\Pazienti\Index.jsx ^
  src\pages\Pazienti\Form.jsx ^
  src\pages\Pazienti\Anagrafica.jsx ^
  src\pages\Pazienti\Fabbisogni.jsx ^
  src\pages\Pazienti\TabsPazienti\Index.jsx ^
  src\pages\Pazienti\TabsPazienti\Form.jsx ^
  src\pages\Visite\Index.jsx ^
  src\pages\Visite\Form.jsx ^
  src\pages\Progressi\Index.jsx ^
  src\pages\Progressi\Form.jsx ^
  src\pages\Piani\Index.jsx ^
  src\pages\Piani\Form.jsx ^
  src\pages\Alimenti\Index.jsx ^
  src\pages\Alimenti\Form.jsx ^
  src\pages\TemplateDiete\Index.jsx ^
  src\pages\TemplateDiete\Form.jsx ^
  src\pages\DatabaseAlimenti\Index.jsx ^
  src\pages\DatabaseAlimenti\Form.jsx ^
  src\pages\Appuntamenti\Index.jsx ^
  src\pages\Report\Index.jsx

REM Controllo file
set missing=0
for %%f in (%files%) do (
  if not exist %%f (
    echo File mancante: %%f
    set /a missing+=1
  )
)

if !missing! equ 0 (
  echo.
  echo TUTTI I FILE SONO PRESENTI!
) else (
  echo.
  echo SONO STATI TROVATI !missing! FILE MANCANTI.
)

pause
