param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("playpause", "play", "pause", "next", "prev", "stop")]
    [string]$Acao
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class MediaCommands {
    private const uint WM_APPCOMMAND = 0x0319;
    private const uint SMTO_ABORTIFHUNG = 0x0002;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SendMessageTimeout(
        IntPtr hWnd,
        uint Msg,
        IntPtr wParam,
        IntPtr lParam,
        uint fuFlags,
        uint uTimeout,
        out IntPtr lpdwResult);

    public static bool Send(int appCommand) {
        IntPtr result;
        IntPtr lParam = new IntPtr((long)appCommand << 16);
        IntPtr sent = SendMessageTimeout(
            new IntPtr(0xffff),
            WM_APPCOMMAND,
            IntPtr.Zero,
            lParam,
            SMTO_ABORTIFHUNG,
            2000,
            out result);
        return sent != IntPtr.Zero;
    }
}
"@

$comandos = @{
    "playpause" = @{ Codigo = 14; Mensagem = "Play/Pause enviado" }
    "play"      = @{ Codigo = 46; Mensagem = "Comando de reprodução enviado" }
    "pause"     = @{ Codigo = 47; Mensagem = "Comando de pausa enviado" }
    "next"      = @{ Codigo = 11; Mensagem = "Próxima faixa" }
    "prev"      = @{ Codigo = 12; Mensagem = "Faixa anterior" }
    "stop"      = @{ Codigo = 13; Mensagem = "Mídia parada" }
}

$comando = $comandos[$Acao.ToLower()]
if (-not [MediaCommands]::Send($comando.Codigo)) {
    throw "O Windows não confirmou o envio do comando de mídia '$Acao'."
}

Write-Output $comando.Mensagem
