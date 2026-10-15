# Stats do Dell G15 5525 — retorna JSON com CPU, RAM, bateria e GPU

# CPU (media dos ultimos 2 segundos)
$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average

# RAM
$os       = Get-CimInstance Win32_OperatingSystem
$ramTotal = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
$ramLivre = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
$ramUsada = [math]::Round($ramTotal - $ramLivre, 1)
$ramPct   = [math]::Round(($ramUsada / $ramTotal) * 100)

# Bateria
$bat        = Get-CimInstance Win32_Battery
$carga      = if ($bat) { [int]$bat.EstimatedChargeRemaining } else { $null }
$statusBat  = if ($bat) { [int]$bat.BatteryStatus } else { $null }
$carregando = $statusBat -in @(6, 7, 8, 9)
# O estado 2 informa que há alimentação AC disponível, mas não confirma carga ativa.
$naTomada   = ($statusBat -eq 2) -or $carregando

# GPU NVIDIA (RTX do G15)
$gpuTemp = $null
try {
    $raw = & nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader 2>$null
    if ($raw) { $gpuTemp = [int]$raw.Trim() }
} catch {}

# Plano de energia ativo
$planoRaw = powercfg /getactivescheme
$plano    = if ($planoRaw -match '\((.+?)\)') { $matches[1] } else { 'Desconhecido' }

@{
    cpu_pct    = [int]$cpu
    ram_usada  = $ramUsada
    ram_total  = $ramTotal
    ram_pct    = $ramPct
    bateria    = $carga
    carregando = $carregando
    na_tomada  = $naTomada
    gpu_temp   = $gpuTemp
    plano      = $plano.Trim()
} | ConvertTo-Json -Compress
