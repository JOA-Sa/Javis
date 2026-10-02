@echo off
chcp 65001 >nul
echo [🛑] Parando instâncias ativas do Jarvis Local...

powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*src/index.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"

echo [✅] Jarvis finalizado.
pause
