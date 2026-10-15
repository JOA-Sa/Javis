@echo off
chcp 65001 >nul
echo [🛑] Encerrando processos do Jarvis...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0parar_jarvis.ps1"
timeout /t 2 >nul
