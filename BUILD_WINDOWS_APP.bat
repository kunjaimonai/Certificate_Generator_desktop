@echo off
color 0B
title Building Certificate Generator - Windows Application

echo ========================================
echo Building Certificate Generator
echo ========================================
echo.

REM Step 1: Build Python Backend
echo [1/4] Building Python Backend...
cd python-backend
call venv\Scripts\activate
pip install pyinstaller
pyinstaller certificate_generator.spec
if errorlevel 1 (
    echo ERROR: Failed to build Python backend
    pause
    exit /b 1
)
call deactivate
cd ..
echo       DONE!
echo.

REM Step 2: Build Next.js
echo [2/4] Building Next.js Frontend...
cd nextjs-frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build Next.js
    pause
    exit /b 1
)
cd ..
echo       DONE!
echo.

REM Step 3: Copy necessary files
echo [3/4] Preparing resources...
xcopy /E /I /Y python-backend\templates electron\build\python-backend\templates
echo       DONE!
echo.

REM Step 4: Build Electron App
echo [4/4] Building Windows Installer...
cd electron
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build Electron app
    pause
    exit /b 1
)
cd ..
echo       DONE!
echo.

echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Installer location:
echo electron\dist\Certificate Generator Setup 1.0.0.exe
echo.
echo File size: ~200-300 MB
echo.
pause