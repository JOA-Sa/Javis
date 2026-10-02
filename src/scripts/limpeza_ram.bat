@echo off
chcp 65001 >nul
echo [🧹] Iniciando limpeza do sistema...

:: 1. Limpeza de arquivos temporários do usuário
del /q /f /s "%TEMP%\*" >nul 2>&1
for /d %%p in ("%TEMP%\*") do rmdir /s /q "%%p" >nul 2>&1

:: 2. Limpeza de temporários do Windows
del /q /f /s "C:\Windows\Temp\*" >nul 2>&1
for /d %%p in ("C:\Windows\Temp\*") do rmdir /s /q "%%p" >nul 2>&1

:: 3. Esvaziar lixeira silenciosamente via PowerShell
powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1

:: 4. Reduzir working set de processos em segundo plano para liberar RAM
powershell -NoProfile -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()" >nul 2>&1

echo [✅] Limpeza concluída com sucesso!
