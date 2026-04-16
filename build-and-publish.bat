@echo off
REM Script per build e pubblicazione su GitHub (Windows)
REM Uso: build-and-publish.bat [versione]

setlocal enabledelayedexpansion

set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[33m"
set "NC=[0m"

REM Versione corrente
for /f "delims=" %%i in ('node -p "require('./package.json').version"') do set "CURRENT_VERSION=%%i"
set "NEW_VERSION=%~1"
if "%NEW_VERSION%"=="" set "NEW_VERSION=%CURRENT_VERSION%"

echo.
echo %YELLOW%========================================%NC%
echo %YELLOW%  Pipe Link Generator - Build & Publish%NC%
echo %YELLOW%========================================%NC%
echo.
echo Versione attuale: %CURRENT_VERSION%
echo Nuova versione: %NEW_VERSION%
echo.

REM Verifica gh
where gh >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%Errore: GitHub CLI (gh) non installato%NC%
    echo Installalo da: https://github.com/cli/cli#installation
    exit /b 1
)

set /p CONFIRM="Procedere con la build e pubblicazione? (s/n) "
if /i not "%CONFIRM%"=="s" (
    echo Operazione annullata
    exit /b 0
)

echo.
echo %GREEN%1. Pulizia release folder...%NC%
if exist release rmdir /s /q release
mkdir release

echo.
echo %GREEN%2. Build Windows (exe)...%NC%
call npm run build:win

echo.
echo %GREEN%3. Pubblicazione su GitHub...%NC%

REM Crea tag
git tag -a "v%NEW_VERSION%" -m "Release v%NEW_VERSION%"

REM Push tag
git push origin "v%NEW_VERSION%"

REM Cerca file
for /f "delims=" %%i in ('dir /b release\*.exe 2^>nul') do set "RELEASE_FILE_WIN=%%i"

if defined RELEASE_FILE_WIN (
    echo Upload Windows: %RELEASE_FILE_WIN%
    gh release create "v%NEW_VERSION%" --title "Release v%NEW_VERSION%" --notes "Build automatica del %date%" "release\%RELEASE_FILE_WIN%"
)

echo.
echo %GREEN%========================================%NC%
echo %GREEN%  Pubblicazione completata!%NC%
echo %GREEN%========================================%NC%
echo.
echo Release creata: https://github.com/zak066/pipenewsgenerator/releases/tag/v%NEW_VERSION%
echo.
echo Note:"
echo "- Build Windows completata e pubblicata"
echo "- Per Linux: esegui ./build-and-publish.sh sulla macchina Linux"
echo "- Gli utenti riceveranno la notifica dell'aggiornamento per entrambe le piattaforme"

endlocal