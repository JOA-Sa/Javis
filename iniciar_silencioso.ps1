# Inicia o Jarvis 100% invisível em segundo plano com logs
$appDir = "C:\Users\Joao\Documents\GitHub\Javis"
Start-Process -FilePath "C:\Program Files\nodejs\node.exe" `
    -ArgumentList "src/index.js" `
    -WorkingDirectory $appDir `
    -RedirectStandardOutput "$appDir\jarvis.log" `
    -RedirectStandardError "$appDir\jarvis_error.log" `
    -WindowStyle Hidden
