@echo off
chcp 65001 >nul
echo ========================================================
echo  JARVIS - TUNEL REMOTO SEGURO (CLOUDFLARE ZERO TRUST)
echo ========================================================
echo.
if not exist "%~dp0bin" mkdir "%~dp0bin"
if not exist "%~dp0bin\cloudflared.exe" (
    echo [📥] Baixando executavel do Cloudflare Tunnel...
    curl.exe -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -o "%~dp0bin\cloudflared.exe"
)
echo [🚀] Iniciando tunel HTTPS publico para o Jarvis...
echo Copie o link 'https://...trycloudflare.com' exibido abaixo para usar no Galaxy S23 no 4G/5G!
echo.
"%~dp0bin\cloudflared.exe" tunnel --url http://localhost:3000
pause
