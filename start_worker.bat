@echo off
title AI English Video Worker - Background Processor
echo ======================================================
echo    AI English Learning System - Local Worker
echo ======================================================
echo.
echo Status: Starting...
echo [Settings] Connecting to Supabase via .env
echo [Action] Monitoring pending videos...
echo.

:: Check if python is in path
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python.
    pause
    exit /b
)

:: Run the worker (Continuous mode)
python worker.py

echo.
echo [INFO] Worker has stopped.
pause
