@echo off
:: Ensures the window stays open even if an unexpected error occurs during startup
if not "%1"=="STAY_OPEN" (
    cmd /k "%~f0" STAY_OPEN
    exit /b
)

title Nexus Smart Backup - Builder 🛡️
color 0b

:start
cls
echo ==========================================
echo    NEXUS BACKUP SYSTEM - CLEAN BUILDER
echo ==========================================
echo.
echo [1/2] Cleaning old build files...
:: Remove previous build outputs to prevent EPERM errors and cache issues
if exist "dist-build" (
    echo Deleting dist-build folder...
    rmdir /s /q "dist-build"
)

echo.
echo [2/2] Building the Portable Application...
:: Execute build command (using 'call' to ensure script continues after build)
call npm run build

echo.
echo ==========================================
if %ERRORLEVEL% EQU 0 (
    color 0a
    echo [V] BUILD SUCCESSFUL! 
    echo Check the 'dist-build' folder for your portable .exe file.
) else (
    color 0c
    echo [X] BUILD FAILED! Error Code: %ERRORLEVEL%
    echo Please check the error messages above.
)
echo ==========================================
echo.
echo Press any key to run the build again, or close this window manually.
pause
echo.
echo Restarting build process...
goto start