# wol.ps1 — Envia Magic Packet UDP para acordar o Dell G15 via Wake-on-LAN
# Uso: powershell -ExecutionPolicy Bypass -File wol.ps1 -MacAddress "AA:BB:CC:DD:EE:FF" -BroadcastAddress "192.168.1.255"

param(
    [Parameter(Mandatory=$true)]
    [string]$MacAddress,

    [string]$BroadcastAddress = "255.255.255.255",
    [int]$Port = 9
)

try {
    # Normaliza o MAC: remove delimitadores e converte em bytes
    $macLimpo = $MacAddress -replace '[:\-\.]', ''
    if ($macLimpo.Length -ne 12) {
        Write-Error "MAC inválido: '$MacAddress'. Use o formato AA:BB:CC:DD:EE:FF"
        exit 1
    }

    $macBytes = [byte[]]::new(6)
    for ($i = 0; $i -lt 6; $i++) {
        $macBytes[$i] = [Convert]::ToByte($macLimpo.Substring($i * 2, 2), 16)
    }

    # Magic Packet: 6 bytes 0xFF seguidos de 16 repetições do MAC (102 bytes total)
    $pacote = [byte[]]::new(102)
    for ($i = 0; $i -lt 6; $i++) { $pacote[$i] = 0xFF }
    for ($r = 0; $r -lt 16; $r++) {
        for ($b = 0; $b -lt 6; $b++) {
            $pacote[6 + $r * 6 + $b] = $macBytes[$b]
        }
    }

    # Envia via UDP broadcast
    $udp = [System.Net.Sockets.UdpClient]::new()
    $udp.EnableBroadcast = $true
    $udp.Connect($BroadcastAddress, $Port)
    $enviado = $udp.Send($pacote, $pacote.Length)
    $udp.Close()

    if ($enviado -eq 102) {
        Write-Output "OK: Magic Packet enviado para $MacAddress via $BroadcastAddress`:$Port"
        exit 0
    } else {
        Write-Error "Envio incompleto: $enviado bytes enviados (esperado 102)"
        exit 1
    }
} catch {
    Write-Error "Erro ao enviar Wake-on-LAN: $_"
    exit 1
}
