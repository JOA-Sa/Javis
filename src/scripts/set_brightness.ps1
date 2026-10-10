param(
    [Parameter(Mandatory=$true)]
    [ValidateRange(0, 100)]
    [int]$Nivel
)

try {
    # Ajusta o brilho da tela do notebook Dell G15 via WMI
    $monitor = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods -ErrorAction Stop
    if ($monitor) {
        $monitor | Invoke-CimMethod -MethodName WmiSetBrightness -Arguments @{ Timeout = 1; Brightness = $Nivel } | Out-Null
        Write-Output "Brilho ajustado para $Nivel%"
    } else {
        Write-Error "Nenhum monitor compatível com WMI encontrado."
    }
} catch {
    # Fallback via PowerShell genérico
    try {
        (Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, $Nivel) | Out-Null
        Write-Output "Brilho ajustado para $Nivel%"
    } catch {
        Write-Error "Falha ao ajustar brilho: $($_.Exception.Message)"
    }
}
