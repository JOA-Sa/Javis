@echo off
chcp 65001 >nul
cd /d "%~dp0"
node src/index.js >> "%~dp0jarvis.log" 2>> "%~dp0jarvis_error.log"
