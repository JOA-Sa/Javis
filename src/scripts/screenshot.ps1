param(
    [string]$OutputPath = "$env:TEMP\jarvis_screenshot.png"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Captura todos os monitores combinados
$bounds = [System.Windows.Forms.Screen]::AllScreens |
    ForEach-Object { $_.Bounds } |
    Measure-Object -Property Left, Top, Right, Bottom -Minimum -Maximum

$left   = ($bounds | Where-Object { $_.Property -eq 'Left' }).Minimum
$top    = ($bounds | Where-Object { $_.Property -eq 'Top' }).Minimum
$right  = ($bounds | Where-Object { $_.Property -eq 'Right' }).Maximum
$bottom = ($bounds | Where-Object { $_.Property -eq 'Bottom' }).Maximum

$width  = $right  - $left
$height = $bottom - $top

$bitmap   = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($left, $top, 0, 0, $bitmap.Size)

$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Output $OutputPath
