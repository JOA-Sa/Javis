# Inicia o Jarvis 100% invisível em segundo plano com logs
$appDir = $PSScriptRoot
$pidFile = Join-Path $appDir 'jarvis.pid'
$nodeExe = (Get-Command 'node.exe' -ErrorAction Stop).Source

if (Test-Path -LiteralPath $pidFile) {
    try {
        $registro = Get-Content -LiteralPath $pidFile
        $pidExistente = [int]$registro[0]
        $inicioEsperado = [long]$registro[1]
        $processoExistente = Get-Process -Id $pidExistente -ErrorAction Stop
        if ($processoExistente.ProcessName -eq 'node' -and $processoExistente.StartTime.ToFileTimeUtc() -eq $inicioEsperado) {
            Write-Output "Jarvis já está em execução (PID $pidExistente)."
            exit 0
        }
    } catch {
        # Registro ausente, antigo ou inválido: inicia uma nova instância.
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$processo = Start-Process -FilePath $nodeExe `
    -ArgumentList "src/index.js" `
    -WorkingDirectory $appDir `
    -RedirectStandardOutput "$appDir\jarvis.log" `
    -RedirectStandardError "$appDir\jarvis_error.log" `
    -WindowStyle Hidden `
    -PassThru

$inicio = $processo.StartTime.ToFileTimeUtc()
@($processo.Id, $inicio) | Set-Content -LiteralPath $pidFile -Encoding ASCII
