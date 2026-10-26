Add-Type -AssemblyName System.Drawing
$pngPath = Join-Path $PSScriptRoot "..\..\public\icon-192.png"
if (Test-Path $pngPath) {
    $bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $pngPath))
    $thumb = New-Object System.Drawing.Bitmap $bmp, 64, 64
    $hIcon = $thumb.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    $outPath = Join-Path $PSScriptRoot "..\..\jarvis.ico"
    $fs = New-Object System.IO.FileStream($outPath, [System.IO.FileMode]::Create)
    $icon.Save($fs)
    $fs.Close()
    $icon.Dispose()
    $thumb.Dispose()
    $bmp.Dispose()
    Write-Output "Criado: $outPath"
}
