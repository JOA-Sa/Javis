param(
    [ValidateSet("ativar", "desativar", "status")]
    [string]$Acao = "status"
)

$regPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings"
if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

if ($Acao -eq "ativar") {
    Set-ItemProperty -Path $regPath -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 0 -Type DWord -Force | Out-Null
    Write-Output "Modo Não Perturbe (Foco) ativado."
} elseif ($Acao -eq "desativar") {
    Set-ItemProperty -Path $regPath -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 1 -Type DWord -Force | Out-Null
    Write-Output "Modo Não Perturbe desativado (notificações normais)."
} else {
    $item = Get-ItemProperty -Path $regPath -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -ErrorAction SilentlyContinue
    $val = if ($item) { $item.NOC_GLOBAL_SETTING_TOASTS_ENABLED } else { $null }
    $ativo = if ($val -eq 0) { $true } else { $false }
    @{ nao_perturbe = $ativo } | ConvertTo-Json -Compress

}
