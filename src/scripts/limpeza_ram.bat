@echo off
chcp 65001 >nul
echo [🧹] Iniciando limpeza do sistema...

REM 1. Limpeza de arquivos temporarios do usuario
del /q /f /s "%TEMP%\*" >nul 2>&1
for /d %%p in ("%TEMP%\*") do rmdir /s /q "%%p" >nul 2>&1

REM 2. Limpeza de temporarios do Windows
del /q /f /s "C:\Windows\Temp\*" >nul 2>&1
for /d %%p in ("C:\Windows\Temp\*") do rmdir /s /q "%%p" >nul 2>&1

REM 3. Esvaziar lixeira silenciosamente via PowerShell
powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1

REM 4. Reduzir working set de processos para liberar RAM fisica
powershell -NoProfile -Command "$def = 'using System; using System.Runtime.InteropServices; public class MemTrim { [DllImport(\"psapi.dll\")] public static extern int EmptyWorkingSet(IntPtr hwProc); }'; Add-Type -TypeDefinition $def; Get-Process | ForEach-Object { try { [MemTrim]::EmptyWorkingSet($_.Handle) | Out-Null } catch {} }" >nul 2>&1

echo [✅] Limpeza concluida com sucesso!
