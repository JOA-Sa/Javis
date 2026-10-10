@echo off
chcp 65001 >nul
echo [🛑] Encerrando processos do Jarvis...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo [✅] Jarvis finalizado com sucesso!
timeout /t 2 >nul
