param(
    [Parameter(Mandatory=$true)]
    [ValidateRange(0, 100)]
    [int]$Volume
)

# Controla o volume do sistema usando a API de audio do Windows (sem dependencias externas)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class VolumeControl {
    [DllImport("winmm.dll")]
    public static extern int waveOutSetVolume(IntPtr hwo, uint dwVolume);

    public static void Set(int percent) {
        uint v = (uint)(Math.Round(65535.0 * percent / 100.0));
        uint dw = v | (v << 16); // Canal esquerdo | canal direito
        waveOutSetVolume(IntPtr.Zero, dw);
    }
}
"@

[VolumeControl]::Set($Volume)
Write-Output "Volume definido para $Volume%"
