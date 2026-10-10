@echo off
chcp 65001 >nul
echo [🔍] Verificando status do Jarvis...
netstat -aon | findstr :3000 >nul
if %errorlevel% == 0 (
    echo.
    echo ==============================================
    echo [✅] JARVIS ESTA ONLINE E RODANDO NA PORTA 3000!
    echo ==============================================
) else (
    echo.
    echo ==============================================
    echo [❌] JARVIS NAO ESTA RODANDO NO MOMENTO.
    echo ==============================================
)
echo.
pause
