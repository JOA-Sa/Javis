Set WshShell = CreateObject("WScript.Shell")
' Obtém o diretório atual do script
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Executa o Jarvis em segundo plano sem abrir janela de prompt (0 = oculto)
WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /c node src/index.js", 0, False
