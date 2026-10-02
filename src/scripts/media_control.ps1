param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("playpause", "play", "pause", "next", "prev", "stop")]
    [string]$Acao
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
    public const byte VK_MEDIA_PREV_TRACK = 0xB1;
    public const byte VK_MEDIA_STOP       = 0xB2;
    public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;

    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static void SendKey(byte vk) {
        keybd_event(vk, 0, 0, 0);
        keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
    }
}
"@

switch ($Acao.ToLower()) {
    "playpause" { [MediaKeys]::SendKey([MediaKeys]::VK_MEDIA_PLAY_PAUSE); Write-Output "Play/Pause enviado" }
    "play"      { [MediaKeys]::SendKey([MediaKeys]::VK_MEDIA_PLAY_PAUSE); Write-Output "Play/Pause enviado" }
    "pause"     { [MediaKeys]::SendKey([MediaKeys]::VK_MEDIA_PLAY_PAUSE); Write-Output "Play/Pause enviado" }
    "next"      { [MediaKeys]::SendKey([MediaKeys]::VK_MEDIA_NEXT_TRACK); Write-Output "Próxima faixa" }
    "prev"      { [MediaKeys]::SendKey([MediaKeys]::VK_MEDIA_PREV_TRACK); Write-Output "Faixa anterior" }
    "stop"      { [MediaKeys]::SendKey([MediaKeys]::VK_MEDIA_STOP); Write-Output "Mídia parada" }
}
