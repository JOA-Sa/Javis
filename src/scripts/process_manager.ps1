param(
    [ValidateSet("listar", "matar")]
    [string]$Acao = "listar",
    [int]$ProcessoId = 0
)

if ($Acao -eq "listar") {
    $processos = Get-Process |
        Where-Object { $_.ProcessName -notmatch '^(idle|system|registry|svchost|csrss|wininit|services|smss)$' } |
        Sort-Object -Property WorkingSet64 -Descending |
        Select-Object -First 10 |
        ForEach-Object {
            @{
                pid  = $_.Id
                nome = $_.ProcessName
                ram  = [math]::Round($_.WorkingSet64 / 1MB, 1)
                cpu  = [math]::Round($_.CPU, 1)
            }
        }
    $processos | ConvertTo-Json -Compress
} elseif ($Acao -eq "matar") {
    if ($ProcessoId -le 4) {
        Write-Error "Não é permitido finalizar processos críticos do sistema."
        exit 1
    }
    try {
        $p = Get-Process -Id $ProcessoId -ErrorAction Stop
        $nome = $p.ProcessName
        Stop-Process -Id $ProcessoId -Force -ErrorAction Stop
        Write-Output "Processo $nome (PID $ProcessoId) finalizado com sucesso."
    } catch {
        Write-Error "Falha ao finalizar processo com PID ${ProcessoId}: $($_.Exception.Message)"

        exit 1
    }
}
