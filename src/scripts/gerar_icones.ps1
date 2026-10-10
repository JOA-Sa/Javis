Add-Type -AssemblyName System.Drawing
foreach ($size in @(192, 512)) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#090d16'))
    
    # Desenhar círculo ciano
    $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#00f0ff'), ($size * 0.05))
    $g.DrawEllipse($pen, ($size * 0.1), ($size * 0.1), ($size * 0.8), ($size * 0.8))
    
    # Desenhar Letra J
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#00f0ff'))
    $font = New-Object System.Drawing.Font('Arial', ($size * 0.4), [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('J', $font, $brush, $rect, $sf)
    
    $outPath = Join-Path $PSScriptRoot "..\..\public\icon-$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Criado: $outPath"
}
