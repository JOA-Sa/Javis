param(
    [string]$OutputPath = "$env:TEMP\jarvis_screenshot.png"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Mede os limites de todos os monitores combinados
$bounds = [System.Windows.Forms.Screen]::AllScreens |
    ForEach-Object { $_.Bounds } |
    Measure-Object -Property Left, Top, Right, Bottom -Minimum -Maximum

$left   = [int]($bounds | Where-Object { $_.Property -eq 'Left' }).Minimum
$top    = [int]($bounds | Where-Object { $_.Property -eq 'Top' }).Minimum
$right  = [int]($bounds | Where-Object { $_.Property -eq 'Right' }).Maximum
$bottom = [int]($bounds | Where-Object { $_.Property -eq 'Bottom' }).Maximum

$width  = [int]($right - $left)
$height = [int]($bottom - $top)

if ($width -le 0)  { $width  = 1920 }
if ($height -le 0) { $height = 1080 }

# Tenta capturar via Win32 GDI BitBlt (funciona de forma confiavel mesmo em processos em background)
$sucesso = $false

try {
    if (-not ([System.Management.Automation.PSTypeName]'JarvisScreenCapture').Type) {
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        using System.Drawing;

        public class JarvisScreenCapture {
            [DllImport("user32.dll")]
            public static extern IntPtr GetDesktopWindow();

            [DllImport("user32.dll")]
            public static extern IntPtr GetWindowDC(IntPtr hWnd);

            [DllImport("user32.dll")]
            public static extern IntPtr ReleaseDC(IntPtr hWnd, IntPtr hDC);

            [DllImport("gdi32.dll")]
            public static extern bool BitBlt(IntPtr hObject, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hObjectSource, int nXSrc, int nYSrc, int dwRop);

            [DllImport("gdi32.dll")]
            public static extern IntPtr CreateCompatibleBitmap(IntPtr hDC, int nWidth, int nHeight);

            [DllImport("gdi32.dll")]
            public static extern IntPtr CreateCompatibleDC(IntPtr hDC);

            [DllImport("gdi32.dll")]
            public static extern bool DeleteDC(IntPtr hDC);

            [DllImport("gdi32.dll")]
            public static extern bool DeleteObject(IntPtr hObject);

            [DllImport("gdi32.dll")]
            public static extern IntPtr SelectObject(IntPtr hDC, IntPtr hObject);

            const int SRCCOPY = 0x00CC0020;

            public static Bitmap Capture(int x, int y, int width, int height) {
                IntPtr hDesk = GetDesktopWindow();
                IntPtr hSrce = GetWindowDC(hDesk);
                IntPtr hDest = CreateCompatibleDC(hSrce);
                IntPtr hBmp = CreateCompatibleBitmap(hSrce, width, height);
                IntPtr hOldBmp = SelectObject(hDest, hBmp);

                BitBlt(hDest, 0, 0, width, height, hSrce, x, y, SRCCOPY);
                Bitmap bmp = Image.FromHbitmap(hBmp);

                SelectObject(hDest, hOldBmp);
                DeleteObject(hBmp);
                DeleteDC(hDest);
                ReleaseDC(hDesk, hSrce);

                return bmp;
            }
        }
"@ -ReferencedAssemblies System.Drawing
    }

    $bmpWin32 = [JarvisScreenCapture]::Capture($left, $top, $width, $height)
    if ($bmpWin32) {
        $bmpWin32.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmpWin32.Dispose()
        $sucesso = $true
    }
} catch {
    # Fallback para CopyFromScreen
    try {
        $bitmap   = New-Object System.Drawing.Bitmap($width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($left, $top, 0, 0, $bitmap.Size)
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
        $sucesso = $true
    } catch {
        Write-Error "Falha ao capturar screenshot: $($_.Exception.Message)"
        exit 1
    }
}

if ($sucesso -and (Test-Path -LiteralPath $OutputPath)) {
    Write-Output $OutputPath
} else {
    Write-Error "Arquivo de screenshot nao foi gerado."
    exit 1
}
