@echo off
chcp 65001 >nul
title Cloudflare Tunnel — Jarvis Remoto
echo ========================================================
echo   🌐 INICIANDO ACESSO EXTERNO SEGURO COM CLOUDFLARE
echo ========================================================
echo.

set "BIN_DIR=%~dp0bin"
set "CLOUDFLARED=%BIN_DIR%\cloudflared.exe"

if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"

:: Baixa o cloudflared oficial caso ainda não esteja na pasta
if not exist "%CLOUDFLARED%" (
    echo [⬇️] Baixando Cloudflare Tunnel client oficial...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CLOUDFLARED%'"
    echo [✅] Download concluído!
    echo.
)

echo [🚀] Criando túnel seguro HTTPS para o Jarvis (porta 3000)...
echo.
echo ========================================================
echo  Copie o link HTTPS que aparecer abaixo (terminado em .trycloudflare.com)
echo  e abra no navegador do seu Samsung Galaxy S23 em qualquer lugar do mundo!
echo ========================================================
echo.

"%CLOUDFLARED%" tunnel --url http://localhost:3000
pause
