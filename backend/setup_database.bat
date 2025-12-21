@echo off
echo ========================================
echo   ApparelDesk Database Setup (Windows)
echo ========================================
echo.

REM Check if we're in the backend directory
if not exist "manage.py" (
    echo Error: Please run this script from the backend directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Check if virtual environment is activated
python -c "import sys; exit(0 if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix) else 1)" 2>nul
if errorlevel 1 (
    echo Warning: Virtual environment may not be activated
    echo Please activate your virtual environment first:
    echo   venv\Scripts\activate
    echo.
    set /p continue="Continue anyway? (y/N): "
    if /i not "%continue%"=="y" exit /b 1
)

echo Running comprehensive database setup...
echo.

REM Run the setup script
python setup_database.py

if errorlevel 1 (
    echo.
    echo Setup failed! Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now:
echo 1. Start Django server: python manage.py runserver
echo 2. Access admin panel: http://localhost:8000/admin
echo 3. Check database status: python check_database.py
echo.
pause