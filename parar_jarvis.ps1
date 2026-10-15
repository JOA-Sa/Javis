$pidFile = Join-Path $PSScriptRoot 'jarvis.pid'

if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Output 'Nenhum processo Jarvis iniciado pelo inicializador foi encontrado.'
    exit 0
}

try {
    $registro = Get-Content -LiteralPath $pidFile
    if ($registro.Count -lt 2) {
        throw 'Registro de processo incompleto.'
    }

    $pidAlvo = [int]$registro[0]
    $inicioEsperado = [long]$registro[1]
    $processo = Get-Process -Id $pidAlvo -ErrorAction Stop

    if ($processo.ProcessName -ne 'node' -or $processo.StartTime.ToFileTimeUtc() -ne $inicioEsperado) {
        Write-Output 'O registro está desatualizado; nenhum outro processo foi encerrado.'
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
        exit 0
    }

    Stop-Process -Id $pidAlvo -Force -ErrorAction Stop
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    Write-Output "Jarvis finalizado (PID $pidAlvo)."
} catch {
    Write-Output "Não foi possível encerrar o Jarvis: $($_.Exception.Message)"
}
