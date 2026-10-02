@echo off
chcp 65001 >nul
echo [⚡] Configurando inicialização automática do Jarvis no Windows...

set "TARGET_DIR=%~dp0"
set "VBS_SCRIPT=%TARGET_DIR%iniciar_jarvis_oculto.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\JarvisLocal.lnk"

:: Cria atalho na pasta de Inicialização do Windows via PowerShell
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '`"%VBS_SCRIPT%`"'; $s.WorkingDirectory = '%TARGET_DIR%'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [✅] Sucesso! O Jarvis agora iniciará automaticamente em segundo plano ao ligar o PC.
    echo      Local do atalho: %SHORTCUT_PATH%
) else (
    echo [❌] Falha ao criar o atalho de inicialização.
)

pause
