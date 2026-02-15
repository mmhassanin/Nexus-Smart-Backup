@echo off

:: This part ensures the window stays open even if an error occurs

if not "%1"=="am_admin" (

    powershell -Command "Start-Process -Verb RunAs -FilePath '%0' -ArgumentList 'am_admin'"

    exit /b

)



title Nexus Prime - Smart Backup System [DEBUG MODE] 🛡️

color 0A



:: ========================================================

:: CONFIGURATION (PLEASE DOUBLE CHECK THESE PATHS)

:: ========================================================

set "SOURCE_DIR=D:\Projects\Experimental Projects\nexus-prime"

set "DEST_ROOT=D:\Projects\Experimental Projects\nexus-prime-backups"

set "MAX_BACKUPS=18"

set "MAX_SAME_SIZE_COUNT=3"

set "BACKUP_INTERVAL_MIN=20"



:: ========================================================

set "LAST_SIZE=0"

set "SAME_SIZE_STREAK=0"

set /a "INTERVAL_SEC=BACKUP_INTERVAL_MIN*60"



:: Check if Source Directory Exists

if not exist "%SOURCE_DIR%" (

    color 0C

    echo [ERROR] Source directory NOT FOUND: %SOURCE_DIR%

    echo Please check the path in the .bat file.

    pause

    exit

)



:: Create Destination if not exists

if not exist "%DEST_ROOT%" mkdir "%DEST_ROOT%"



echo ========================================================

echo   NEXUS PRIME SMART BACKUP SYSTEM IS STARTING...

echo ========================================================

echo   Source:   %SOURCE_DIR%

echo   Target:   %DEST_ROOT%

echo ========================================================



:loop

for /f "delims=" %%a in ('powershell -Command "Get-Date -format 'yyyy-MM-dd_HH-mm-ss'"') do set "DATETIME=%%a"

set "BACKUP_FOLDER=%DEST_ROOT%\Backup_%DATETIME%"



echo.

echo [%TIME%] Cycle Start. Streak: %SAME_SIZE_STREAK%/%MAX_SAME_SIZE_COUNT%

echo [%TIME%] Creating: Backup_%DATETIME%



:: Perform Backup

robocopy "%SOURCE_DIR%" "%BACKUP_FOLDER%" /E /NFL /NDL /NJH /NJS /XD "node_modules" "dist" "dist-electron" "frontend\dist" ".git" "frontend\node_modules"



:: Calculate Size

echo [%TIME%] Calculating backup size...

for /f "usebackq delims=" %%S in (`powershell -Command "(Get-ChildItem -Path '%BACKUP_FOLDER%' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`) do set "CURRENT_SIZE=%%S"



if "%CURRENT_SIZE%"=="" set "CURRENT_SIZE=0"

echo [%TIME%] Size: %CURRENT_SIZE% Bytes



if "%CURRENT_SIZE%"=="%LAST_SIZE%" (

    set /a SAME_SIZE_STREAK+=1

    echo [%TIME%] [WARNING] Identical size detected.

) else (

    set "SAME_SIZE_STREAK=0"

    set "LAST_SIZE=%CURRENT_SIZE%"

    echo [%TIME%] [INFO] Changes detected.

)



if %SAME_SIZE_STREAK% GEQ %MAX_SAME_SIZE_COUNT% goto STOP_SYSTEM



:: Rotation

for /f "skip=%MAX_BACKUPS% delims=" %%F in ('dir "%DEST_ROOT%" /b /ad /o-d') do (

    echo [%TIME%] [CLEANUP] Removing old backup: %%F

    rd /s /q "%DEST_ROOT%\%%F"

)



echo [%TIME%] Waiting %BACKUP_INTERVAL_MIN% minutes...

timeout /t %INTERVAL_SEC% /nobreak

goto loop



:STOP_SYSTEM

color 4F

echo ========================================================

echo   !!! AUTO-BACKUP STOPPED !!!

echo   Consecutive identical backups: %MAX_SAME_SIZE_COUNT%

echo ========================================================

powershell -Command "Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show('Backup stopped: No changes detected.', 'Nexus Backup', 'OK', 'Warning')"

pause