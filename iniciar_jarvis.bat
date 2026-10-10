@echo off
chcp 65001 >nul
echo [🚀] Iniciando Jarvis em segundo plano...
powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0iniciar_silencioso.ps1"
echo [✅] Jarvis iniciado com sucesso!
timeout /t 2 >nul
