Add-Type -AssemblyName System.Drawing

$sourcePath = "assets\off-rez-branding.jpg"
$destIcon = "assets\icon_fixed.png"
$destAdapt = "assets\adaptive_icon_fixed.png"
$destSplash = "assets\splash_fixed.png"

Write-Host "Processing assets from $sourcePath..."

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found at $sourcePath"
    exit 1
}

try {
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $sourcePath))
} catch {
    Write-Error "Failed to load source image: $_"
    exit 1
}

# 1. Create Icon (Square 1024x1024, PNG)
Write-Host "Generating Icon (1024x1024)..."
$bmp = New-Object System.Drawing.Bitmap 1024, 1024
$g = [System.Drawing.Graphics]::FromImage($bmp)
$bg = [System.Drawing.ColorTranslator]::FromHtml("#020617")
$g.Clear($bg)

# Draw image centered (contain)
$ratio = [Math]::Min(1024/$img.Width, 1024/$img.Height)
$w = [int]($img.Width * $ratio)
$h = [int]($img.Height * $ratio)
$x = [int]((1024 - $w) / 2)
$y = [int]((1024 - $h) / 2)

$g.DrawImage($img, $x, $y, $w, $h)
$bmp.Save($destIcon, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($destAdapt, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

# 2. Create Splash (1242x2436, PNG)
Write-Host "Generating Splash (1242x2436)..."
$bmpSplash = New-Object System.Drawing.Bitmap 1242, 2436
$gS = [System.Drawing.Graphics]::FromImage($bmpSplash)
$gS.Clear($bg)

$ratioS = [Math]::Min(1242/$img.Width, 2436/$img.Height)
$wS = [int]($img.Width * $ratioS)
$hS = [int]($img.Height * $ratioS)
$xS = [int]((1242 - $wS) / 2)
$yS = [int]((2436 - $hS) / 2)

$gS.DrawImage($img, $xS, $yS, $wS, $hS)
$bmpSplash.Save($destSplash, [System.Drawing.Imaging.ImageFormat]::Png)
$gS.Dispose()
$bmpSplash.Dispose()

$img.Dispose()
Write-Host "Assets generated successfully!"
